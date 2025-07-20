import { supabase } from './supabase';

// Types for AI responses
export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  reasoning?: string;
}

export interface AIInsight {
  type: 'engagement' | 'content' | 'participation' | 'recommendation';
  message: string;
  confidence: number;
  timestamp: string;
}

export interface QuestionAnalysis {
  sentiment: SentimentResult;
  category: string;
  priority: 'high' | 'medium' | 'low';
  suggestedResponse?: string;
}

// AI Service Class
class AIService {
  private async getUserApiKeys(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('google_api_key, groq_api_key, google_api_enabled, groq_api_enabled')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching API keys:', error);
      return null;
    }

    return data;
  }

  // Google AI (Gemini) Integration
  private async callGoogleAI(prompt: string, apiKey: string): Promise<any> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Google AI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Google AI API call failed:', error);
      throw error;
    }
  }

  // Groq Integration
  private async callGroqAI(prompt: string, apiKey: string): Promise<any> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq API call failed:', error);
      throw error;
    }
  }

  // Fallback local sentiment analysis
  private localSentimentAnalysis(text: string): SentimentResult {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'like', 'awesome', 'fantastic', 'wonderful', 'helpful', 'clear', 'understand'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'confused', 'unclear', 'difficult', 'hard', 'boring', 'slow'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    if (total === 0) {
      return { sentiment: 'neutral', confidence: 0.5 };
    }

    const positiveRatio = positiveCount / total;
    if (positiveRatio > 0.6) {
      return { sentiment: 'positive', confidence: Math.min(0.9, 0.5 + positiveRatio) };
    } else if (positiveRatio < 0.4) {
      return { sentiment: 'negative', confidence: Math.min(0.9, 0.5 + (1 - positiveRatio)) };
    } else {
      return { sentiment: 'neutral', confidence: 0.6 };
    }
  }

  // Main sentiment analysis function with fallback chain
  async analyzeSentiment(text: string, userId: string): Promise<SentimentResult> {
    try {
      const apiKeys = await this.getUserApiKeys(userId);
      
      if (!apiKeys) {
        return this.localSentimentAnalysis(text);
      }

      // Try Google AI first if enabled and key exists
      if (apiKeys.google_api_enabled && apiKeys.google_api_key) {
        try {
          const prompt = `Analyze the sentiment of this text and respond with only a JSON object containing "sentiment" (positive/neutral/negative), "confidence" (0-1), and "reasoning": "${text}"`;
          const response = await this.callGoogleAI(prompt, apiKeys.google_api_key);
          
          // Try to parse JSON response
          try {
            const parsed = JSON.parse(response);
            if (parsed.sentiment && parsed.confidence !== undefined) {
              return {
                sentiment: parsed.sentiment,
                confidence: parsed.confidence,
                reasoning: parsed.reasoning
              };
            }
          } catch (parseError) {
            // If JSON parsing fails, extract sentiment from text response
            const sentimentMatch = response.toLowerCase().match(/(positive|negative|neutral)/);
            if (sentimentMatch) {
              return {
                sentiment: sentimentMatch[1] as 'positive' | 'neutral' | 'negative',
                confidence: 0.8,
                reasoning: response
              };
            }
          }
        } catch (error) {
          console.warn('Google AI failed, trying Groq:', error);
        }
      }

      // Fallback to Groq if Google AI fails or is disabled
      if (apiKeys.groq_api_enabled && apiKeys.groq_api_key) {
        try {
          const prompt = `Analyze the sentiment of this text. Respond with only: "positive", "negative", or "neutral". Text: "${text}"`;
          const response = await this.callGroqAI(prompt, apiKeys.groq_api_key);
          
          const sentimentMatch = response.toLowerCase().match(/(positive|negative|neutral)/);
          if (sentimentMatch) {
            return {
              sentiment: sentimentMatch[1] as 'positive' | 'neutral' | 'negative',
              confidence: 0.75
            };
          }
        } catch (error) {
          console.warn('Groq AI failed, using local analysis:', error);
        }
      }

      // Final fallback to local analysis
      return this.localSentimentAnalysis(text);
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return this.localSentimentAnalysis(text);
    }
  }

  // Generate AI insights from session data
  async generateSessionInsights(sessionData: any, userId: string): Promise<AIInsight[]> {
    try {
      const apiKeys = await this.getUserApiKeys(userId);
      const insights: AIInsight[] = [];

      if (!apiKeys || (!apiKeys.google_api_enabled && !apiKeys.groq_api_enabled)) {
        // Return fallback insights
        return this.generateFallbackInsights(sessionData);
      }

      const prompt = `Based on this session data, generate 3-5 brief insights about engagement and participation. Session: ${JSON.stringify(sessionData)}. Respond with insights separated by newlines.`;

      let response = '';
      
      // Try Google AI first
      if (apiKeys.google_api_enabled && apiKeys.google_api_key) {
        try {
          response = await this.callGoogleAI(prompt, apiKeys.google_api_key);
        } catch (error) {
          console.warn('Google AI failed for insights, trying Groq:', error);
        }
      }

      // Fallback to Groq
      if (!response && apiKeys.groq_api_enabled && apiKeys.groq_api_key) {
        try {
          response = await this.callGroqAI(prompt, apiKeys.groq_api_key);
        } catch (error) {
          console.warn('Groq AI failed for insights:', error);
        }
      }

      if (response) {
        const lines = response.split('\n').filter(line => line.trim());
        lines.forEach((line, index) => {
          if (line.trim()) {
            insights.push({
              type: index % 2 === 0 ? 'engagement' : 'participation',
              message: line.trim(),
              confidence: 0.8,
              timestamp: new Date().toISOString()
            });
          }
        });
      }

      return insights.length > 0 ? insights : this.generateFallbackInsights(sessionData);
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      return this.generateFallbackInsights(sessionData);
    }
  }

  // Fallback insights when AI is not available
  private generateFallbackInsights(sessionData: any): AIInsight[] {
    const insights: AIInsight[] = [];
    const timestamp = new Date().toISOString();

    if (sessionData.attendees > 10) {
      insights.push({
        type: 'engagement',
        message: 'High attendance detected - strong interest in this topic',
        confidence: 0.7,
        timestamp
      });
    }

    if (sessionData.engagement_score > 80) {
      insights.push({
        type: 'participation',
        message: 'Excellent engagement levels throughout the session',
        confidence: 0.8,
        timestamp
      });
    } else if (sessionData.engagement_score < 50) {
      insights.push({
        type: 'recommendation',
        message: 'Consider more interactive elements to boost engagement',
        confidence: 0.6,
        timestamp
      });
    }

    insights.push({
      type: 'content',
      message: 'Session content appears well-structured and informative',
      confidence: 0.6,
      timestamp
    });

    return insights;
  }

  // Analyze question and provide categorization
  async analyzeQuestion(question: string, userId: string): Promise<QuestionAnalysis> {
    try {
      const sentiment = await this.analyzeSentiment(question, userId);
      
      // Simple categorization logic
      const questionLower = question.toLowerCase();
      let category = 'general';
      let priority: 'high' | 'medium' | 'low' = 'medium';

      if (questionLower.includes('how') || questionLower.includes('what') || questionLower.includes('why')) {
        category = 'clarification';
      } else if (questionLower.includes('problem') || questionLower.includes('issue') || questionLower.includes('error')) {
        category = 'technical';
        priority = 'high';
      } else if (questionLower.includes('example') || questionLower.includes('demo')) {
        category = 'example';
      }

      if (sentiment.sentiment === 'negative') {
        priority = 'high';
      }

      return {
        sentiment,
        category,
        priority,
        suggestedResponse: priority === 'high' ? 'This question requires immediate attention' : undefined
      };
    } catch (error) {
      console.error('Question analysis failed:', error);
      return {
        sentiment: { sentiment: 'neutral', confidence: 0.5 },
        category: 'general',
        priority: 'medium'
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export individual functions for convenience
export const analyzeSentiment = (text: string, userId: string) => aiService.analyzeSentiment(text, userId);
export const generateSessionInsights = (sessionData: any, userId: string) => aiService.generateSessionInsights(sessionData, userId);
export const analyzeQuestion = (question: string, userId: string) => aiService.analyzeQuestion(question, userId);