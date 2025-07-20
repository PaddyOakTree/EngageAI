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

export interface AIModelPerformance {
  modelName: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  uptimePercentage: number;
  lastUsed: string;
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

  // Track AI model performance
  private async trackAIModelPerformance(modelName: string, success: boolean, responseTime: number) {
    try {
      const { data: existing } = await supabase
        .from('ai_model_performance')
        .select('*')
        .eq('model_name', modelName)
        .single();

      if (existing) {
        // Update existing record
        const newRequestCount = existing.request_count + 1;
        const newSuccessCount = existing.success_count + (success ? 1 : 0);
        const newErrorCount = existing.error_count + (success ? 0 : 1);
        const newAvgResponseTime = Math.round(
          (existing.avg_response_time_ms * existing.request_count + responseTime) / newRequestCount
        );
        const newUptimePercentage = (newSuccessCount / newRequestCount) * 100;

        await supabase
          .from('ai_model_performance')
          .update({
            request_count: newRequestCount,
            success_count: newSuccessCount,
            error_count: newErrorCount,
            avg_response_time_ms: newAvgResponseTime,
            uptime_percentage: newUptimePercentage,
            last_used: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('model_name', modelName);
      } else {
        // Create new record
        await supabase
          .from('ai_model_performance')
          .insert({
            model_name: modelName,
            request_count: 1,
            success_count: success ? 1 : 0,
            error_count: success ? 0 : 1,
            avg_response_time_ms: responseTime,
            uptime_percentage: success ? 100 : 0,
            last_used: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error tracking AI model performance:', error);
    }
  }

  // Log AI insights
  private async logAIInsight(sessionId: string, userId: string, insight: AIInsight, modelUsed: string, processingTime: number) {
    try {
      await supabase
        .from('ai_insights_log')
        .insert({
          session_id: sessionId,
          user_id: userId,
          insight_type: insight.type,
          insight_message: insight.message,
          confidence_score: insight.confidence,
          model_used: modelUsed,
          processing_time_ms: processingTime
        });
    } catch (error) {
      console.error('Error logging AI insight:', error);
    }
  }

  // Google AI (Gemini) Integration
  private async callGoogleAI(prompt: string, apiKey: string): Promise<any> {
    const startTime = Date.now();
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

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        await this.trackAIModelPerformance('Google Gemini', false, responseTime);
        throw new Error(`Google AI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      await this.trackAIModelPerformance('Google Gemini', true, responseTime);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.trackAIModelPerformance('Google Gemini', false, responseTime);
      console.error('Google AI API call failed:', error);
      throw error;
    }
  }

  // Groq Integration
  private async callGroqAI(prompt: string, apiKey: string): Promise<any> {
    const startTime = Date.now();
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

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        await this.trackAIModelPerformance('Groq AI', false, responseTime);
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || '';
      
      await this.trackAIModelPerformance('Groq AI', true, responseTime);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.trackAIModelPerformance('Groq AI', false, responseTime);
      console.error('Groq AI API call failed:', error);
      throw error;
    }
  }

  // Fallback local sentiment analysis
  private localSentimentAnalysis(text: string): SentimentResult {
    const startTime = Date.now();
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'like', 'awesome', 'fantastic', 'wonderful', 'helpful', 'clear', 'understand', 'perfect', 'outstanding', 'brilliant', 'superb', 'incredible', 'phenomenal', 'exceptional', 'remarkable'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'confused', 'unclear', 'difficult', 'hard', 'boring', 'slow', 'frustrated', 'annoyed', 'disappointed', 'useless', 'waste', 'pointless', 'complicated', 'overwhelming', 'stressful'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    let sentiment: 'positive' | 'neutral' | 'negative';
    let confidence: number;

    if (total === 0) {
      sentiment = 'neutral';
      confidence = 0.5;
    } else {
      const positiveRatio = positiveCount / total;
      if (positiveRatio > 0.6) {
        sentiment = 'positive';
        confidence = Math.min(0.9, 0.5 + positiveRatio);
      } else if (positiveRatio < 0.4) {
        sentiment = 'negative';
        confidence = Math.min(0.9, 0.5 + (1 - positiveRatio));
      } else {
        sentiment = 'neutral';
        confidence = 0.6;
      }
    }

    const responseTime = Date.now() - startTime;
    this.trackAIModelPerformance('Local Fallback', true, responseTime);

    return { sentiment, confidence };
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
  async generateSessionInsights(sessionData: any, userId: string, sessionId?: string): Promise<AIInsight[]> {
    const startTime = Date.now();
    try {
      const apiKeys = await this.getUserApiKeys(userId);
      const insights: AIInsight[] = [];

      if (!apiKeys || (!apiKeys.google_api_enabled && !apiKeys.groq_api_enabled)) {
        // Return enhanced fallback insights
        const fallbackInsights = this.generateEnhancedFallbackInsights(sessionData);
        if (sessionId) {
          fallbackInsights.forEach(insight => {
            this.logAIInsight(sessionId, userId, insight, 'Local Fallback', Date.now() - startTime);
          });
        }
        return fallbackInsights;
      }

      const prompt = `Based on this session data, generate 3-5 brief insights about engagement and participation. Focus on actionable insights. Session: ${JSON.stringify(sessionData)}. Respond with insights separated by newlines.`;

      let response = '';
      let modelUsed = '';
      
      // Try Google AI first
      if (apiKeys.google_api_enabled && apiKeys.google_api_key) {
        try {
          response = await this.callGoogleAI(prompt, apiKeys.google_api_key);
          modelUsed = 'Google Gemini';
        } catch (error) {
          console.warn('Google AI failed for insights, trying Groq:', error);
        }
      }

      // Fallback to Groq
      if (!response && apiKeys.groq_api_enabled && apiKeys.groq_api_key) {
        try {
          response = await this.callGroqAI(prompt, apiKeys.groq_api_key);
          modelUsed = 'Groq AI';
        } catch (error) {
          console.warn('Groq AI failed for insights:', error);
        }
      }

      if (response) {
        const lines = response.split('\n').filter(line => line.trim());
        lines.forEach((line, index) => {
          if (line.trim()) {
            const insight: AIInsight = {
              type: index % 2 === 0 ? 'engagement' : 'participation',
              message: line.trim(),
              confidence: 0.8,
              timestamp: new Date().toISOString()
            };
            insights.push(insight);
            
            if (sessionId) {
              this.logAIInsight(sessionId, userId, insight, modelUsed, Date.now() - startTime);
            }
          }
        });
      }

      const finalInsights = insights.length > 0 ? insights : this.generateEnhancedFallbackInsights(sessionData);
      
      if (sessionId && insights.length === 0) {
        finalInsights.forEach(insight => {
          this.logAIInsight(sessionId, userId, insight, 'Local Fallback', Date.now() - startTime);
        });
      }

      return finalInsights;
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      const fallbackInsights = this.generateEnhancedFallbackInsights(sessionData);
      if (sessionId) {
        fallbackInsights.forEach(insight => {
          this.logAIInsight(sessionId, userId, insight, 'Local Fallback', Date.now() - startTime);
        });
      }
      return fallbackInsights;
    }
  }

  // Enhanced fallback insights with real data analysis
  private generateEnhancedFallbackInsights(sessionData: any): AIInsight[] {
    const insights: AIInsight[] = [];
    const timestamp = new Date().toISOString();

    // Analyze attendance patterns
    if (sessionData.attendees > 0) {
      const attendanceRate = (sessionData.attendees / (sessionData.max_attendees || 50)) * 100;
      if (attendanceRate > 80) {
        insights.push({
          type: 'engagement',
          message: `High attendance rate (${Math.round(attendanceRate)}%) indicates strong interest in this topic`,
          confidence: 0.85,
          timestamp
        });
      } else if (attendanceRate < 50) {
        insights.push({
          type: 'recommendation',
          message: `Low attendance rate (${Math.round(attendanceRate)}%) - consider promoting this session more actively`,
          confidence: 0.75,
          timestamp
        });
      }
    }

    // Analyze engagement score
    if (sessionData.engagement_score > 80) {
      insights.push({
        type: 'participation',
        message: 'Excellent engagement levels throughout the session',
        confidence: 0.9,
        timestamp
      });
    } else if (sessionData.engagement_score < 50) {
      insights.push({
        type: 'recommendation',
        message: 'Consider adding more interactive elements to boost engagement',
        confidence: 0.8,
        timestamp
      });
    }

    // Analyze session type and format
    if (sessionData.type === 'virtual' && sessionData.meeting_url) {
      insights.push({
        type: 'content',
        message: 'Virtual session with meeting link - ensure technical setup is smooth',
        confidence: 0.7,
        timestamp
      });
    }

    // Analyze session timing
    const sessionDate = new Date(sessionData.date);
    const dayOfWeek = sessionDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      insights.push({
        type: 'engagement',
        message: 'Weekend session - participants may have different engagement patterns',
        confidence: 0.6,
        timestamp
      });
    }

    // Default insight if no specific patterns detected
    if (insights.length === 0) {
      insights.push({
        type: 'content',
        message: 'Session appears well-structured with balanced engagement metrics',
        confidence: 0.7,
        timestamp
      });
    }

    return insights;
  }

  // Analyze question and provide categorization
  async analyzeQuestion(question: string, userId: string): Promise<QuestionAnalysis> {
    try {
      const sentiment = await this.analyzeSentiment(question, userId);
      
      // Enhanced categorization logic
      const questionLower = question.toLowerCase();
      let category = 'general';
      let priority: 'high' | 'medium' | 'low' = 'medium';

      // Technical questions
      if (questionLower.includes('how') && (questionLower.includes('work') || questionLower.includes('implement') || questionLower.includes('setup'))) {
        category = 'technical';
        priority = 'high';
      } else if (questionLower.includes('what') && (questionLower.includes('difference') || questionLower.includes('compare'))) {
        category = 'clarification';
      } else if (questionLower.includes('why') || questionLower.includes('reason')) {
        category = 'explanation';
      } else if (questionLower.includes('example') || questionLower.includes('demo') || questionLower.includes('case')) {
        category = 'example';
      } else if (questionLower.includes('problem') || questionLower.includes('issue') || questionLower.includes('error') || questionLower.includes('bug')) {
        category = 'troubleshooting';
        priority = 'high';
      } else if (questionLower.includes('best') && questionLower.includes('practice')) {
        category = 'best_practices';
      } else if (questionLower.includes('future') || questionLower.includes('trend') || questionLower.includes('next')) {
        category = 'forward_looking';
      }

      // Priority adjustment based on sentiment
      if (sentiment.sentiment === 'negative') {
        priority = 'high';
      } else if (sentiment.sentiment === 'positive' && sentiment.confidence > 0.8) {
        priority = 'medium';
      }

      // Generate suggested response based on category and priority
      let suggestedResponse: string | undefined;
      if (priority === 'high') {
        suggestedResponse = 'This question requires immediate attention from the moderator';
      } else if (category === 'technical') {
        suggestedResponse = 'Consider providing a step-by-step explanation or demonstration';
      } else if (category === 'example') {
        suggestedResponse = 'A practical example would help clarify this concept';
      }

      return {
        sentiment,
        category,
        priority,
        suggestedResponse
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

  // Get real AI model performance data
  async getAIModelPerformance(): Promise<AIModelPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('ai_model_performance')
        .select('*')
        .order('last_used', { ascending: false });

      if (error) throw error;

      return (data || []).map(model => ({
        modelName: model.model_name,
        requestCount: model.request_count,
        successCount: model.success_count,
        errorCount: model.error_count,
        avgResponseTime: model.avg_response_time_ms,
        uptimePercentage: model.uptime_percentage,
        lastUsed: model.last_used
      }));
    } catch (error) {
      console.error('Error fetching AI model performance:', error);
      return [];
    }
  }

  // Track engagement analytics
  async trackEngagement(sessionId: string, userId: string, engagementScore: number, participationType: string, durationMinutes: number = 0) {
    try {
      await supabase
        .from('engagement_analytics')
        .insert({
          session_id: sessionId,
          user_id: userId,
          engagement_score: engagementScore,
          participation_type: participationType,
          duration_minutes: durationMinutes,
          metadata: {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            platform: 'web'
          }
        });
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  }

  // Generate daily engagement summary
  async generateDailyEngagementSummary() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if summary already exists for today
      const { data: existing } = await supabase
        .from('daily_engagement_summary')
        .select('*')
        .eq('date', today)
        .single();

      if (existing) {
        return existing;
      }

      // Calculate today's metrics
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      const { data: participants } = await supabase
        .from('session_participants')
        .select('*')
        .gte('joined_at', `${today}T00:00:00`)
        .lt('joined_at', `${today}T23:59:59`);

      const { data: questions } = await supabase
        .from('session_questions')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      const { data: insights } = await supabase
        .from('ai_insights_log')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      // Calculate averages
      const totalSessions = sessions?.length || 0;
      const totalParticipants = participants?.length || 0;
      const totalQuestions = questions?.length || 0;
      const totalInsights = insights?.length || 0;

      let avgEngagement = 0;
      if (sessions && sessions.length > 0) {
        const totalEngagement = sessions.reduce((sum, session) => sum + (session.engagement_score || 0), 0);
        avgEngagement = totalEngagement / sessions.length;
      }

      // Insert daily summary
      const { data: summary } = await supabase
        .from('daily_engagement_summary')
        .insert({
          date: today,
          total_sessions: totalSessions,
          total_participants: totalParticipants,
          avg_engagement_score: avgEngagement,
          total_questions: totalQuestions,
          total_ai_insights: totalInsights
        })
        .select()
        .single();

      return summary;
    } catch (error) {
      console.error('Error generating daily engagement summary:', error);
      return null;
    }
  }
}

const aiService = new AIService();

export default aiService;
export const analyzeSentiment = (text: string, userId: string) => aiService.analyzeSentiment(text, userId);
export const generateSessionInsights = (sessionData: any, userId: string, sessionId?: string) => aiService.generateSessionInsights(sessionData, userId, sessionId);
export const analyzeQuestion = (question: string, userId: string) => aiService.analyzeQuestion(question, userId);
export const getAIModelPerformance = () => aiService.getAIModelPerformance();
export const trackEngagement = (sessionId: string, userId: string, engagementScore: number, participationType: string, durationMinutes?: number) => aiService.trackEngagement(sessionId, userId, engagementScore, participationType, durationMinutes);
export const generateDailyEngagementSummary = () => aiService.generateDailyEngagementSummary();