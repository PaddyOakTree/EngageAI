import { supabase } from './supabase';

export interface EngagementAnalytics {
  totalSessions: number;
  totalParticipants: number;
  totalQuestions: number;
  totalInsights: number;
  avgEngagementScore: number;
  participationRate: number;
  questionRate: number;
  insightRate: number;
}

export interface SessionAnalytics {
  sessionId: string;
  sessionTitle: string;
  participants: number;
  questions: number;
  insights: number;
  engagementScore: number;
  duration: number;
  date: string;
}

export interface UserAnalytics {
  userId: string;
  userName: string;
  sessionsAttended: number;
  questionsAsked: number;
  insightsGenerated: number;
  avgEngagementScore: number;
  totalTimeSpent: number;
  badgesEarned: number;
}

export interface DailyAnalytics {
  date: string;
  sessions: number;
  participants: number;
  questions: number;
  insights: number;
  avgEngagement: number;
}

class AnalyticsService {
  // Get comprehensive engagement analytics
  async getEngagementAnalytics(timeRange: 'day' | 'week' | 'month' | 'all' = 'all'): Promise<EngagementAnalytics> {
    try {
      const startDate = this.getStartDate(timeRange);
      
      // Get sessions data
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .gte('created_at', startDate);

      if (sessionsError) throw sessionsError;

      // Get participants data
      const { data: participants, error: participantsError } = await supabase
        .from('session_participants')
        .select('*')
        .gte('joined_at', startDate);

      if (participantsError) throw participantsError;

      // Get questions data
      const { data: questions, error: questionsError } = await supabase
        .from('session_questions')
        .select('*')
        .gte('created_at', startDate);

      if (questionsError) throw questionsError;

      // Get insights data
      const { data: insights, error: insightsError } = await supabase
        .from('ai_insights_log')
        .select('*')
        .gte('created_at', startDate);

      if (insightsError) throw insightsError;

      // Calculate analytics
      const totalSessions = sessions?.length || 0;
      const totalParticipants = participants?.length || 0;
      const totalQuestions = questions?.length || 0;
      const totalInsights = insights?.length || 0;

      const avgEngagementScore = sessions && sessions.length > 0
        ? sessions.reduce((sum, session) => sum + (session.engagement_score || 0), 0) / sessions.length
        : 0;

      const participationRate = totalSessions > 0 ? (totalParticipants / totalSessions) : 0;
      const questionRate = totalParticipants > 0 ? (totalQuestions / totalParticipants) : 0;
      const insightRate = totalSessions > 0 ? (totalInsights / totalSessions) : 0;

      return {
        totalSessions,
        totalParticipants,
        totalQuestions,
        totalInsights,
        avgEngagementScore: Math.round(avgEngagementScore),
        participationRate: Math.round(participationRate * 100),
        questionRate: Math.round(questionRate * 100),
        insightRate: Math.round(insightRate * 100)
      };
    } catch (error) {
      console.error('Error getting engagement analytics:', error);
      return {
        totalSessions: 0,
        totalParticipants: 0,
        totalQuestions: 0,
        totalInsights: 0,
        avgEngagementScore: 0,
        participationRate: 0,
        questionRate: 0,
        insightRate: 0
      };
    }
  }

  // Get session analytics
  async getSessionAnalytics(limit: number = 10): Promise<SessionAnalytics[]> {
    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (sessionsError) throw sessionsError;

      const sessionAnalytics: SessionAnalytics[] = [];

      for (const session of sessions || []) {
        // Get participants count
        const { count: participants } = await supabase
          .from('session_participants')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);

        // Get questions count
        const { count: questions } = await supabase
          .from('session_questions')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);

        // Get insights count
        const { count: insights } = await supabase
          .from('ai_insights_log')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);

        sessionAnalytics.push({
          sessionId: session.id,
          sessionTitle: session.title,
          participants: participants || 0,
          questions: questions || 0,
          insights: insights || 0,
          engagementScore: session.engagement_score || 0,
          duration: this.calculateSessionDuration(session.start_time, session.end_time),
          date: session.date
        });
      }

      return sessionAnalytics;
    } catch (error) {
      console.error('Error getting session analytics:', error);
      return [];
    }
  }

  // Get user analytics
  async getUserAnalytics(userId?: string): Promise<UserAnalytics[]> {
    try {
      let query = supabase
        .from('profiles')
        .select('id, name, engagement_score, total_events, badges');

      if (userId) {
        query = query.eq('id', userId);
      }

      const { data: users, error: usersError } = await query;

      if (usersError) throw usersError;

      const userAnalytics: UserAnalytics[] = [];

      for (const user of users || []) {
        // Get sessions attended
        const { count: sessionsAttended } = await supabase
          .from('session_participants')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get questions asked
        const { count: questionsAsked } = await supabase
          .from('session_questions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get insights generated
        const { count: insightsGenerated } = await supabase
          .from('ai_insights_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get total time spent
        const { data: participationData } = await supabase
          .from('session_participants')
          .select('time_spent')
          .eq('user_id', user.id);

        const totalTimeSpent = participationData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0;

        userAnalytics.push({
          userId: user.id,
          userName: user.name,
          sessionsAttended: sessionsAttended || 0,
          questionsAsked: questionsAsked || 0,
          insightsGenerated: insightsGenerated || 0,
          avgEngagementScore: user.engagement_score || 0,
          totalTimeSpent,
          badgesEarned: user.badges?.length || 0
        });
      }

      return userAnalytics;
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return [];
    }
  }

  // Get daily analytics
  async getDailyAnalytics(days: number = 7): Promise<DailyAnalytics[]> {
    try {
      const { data: dailySummaries, error } = await supabase
        .from('daily_engagement_summary')
        .select('*')
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      return (dailySummaries || []).map(summary => ({
        date: summary.date,
        sessions: summary.total_sessions,
        participants: summary.total_participants,
        questions: summary.total_questions,
        insights: summary.total_ai_insights,
        avgEngagement: Math.round(summary.avg_engagement_score)
      }));
    } catch (error) {
      console.error('Error getting daily analytics:', error);
      return [];
    }
  }

  // Get engagement trends
  async getEngagementTrends(): Promise<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  }> {
    try {
      const dailyAnalytics = await this.getDailyAnalytics(30);
      
      const labels = dailyAnalytics.map(d => new Date(d.date).toLocaleDateString());
      const engagementData = dailyAnalytics.map(d => d.avgEngagement);
      const sessionsData = dailyAnalytics.map(d => d.sessions);
      const participantsData = dailyAnalytics.map(d => d.participants);

      return {
        labels,
        datasets: [
          {
            label: 'Engagement Score',
            data: engagementData,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          },
          {
            label: 'Sessions',
            data: sessionsData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)'
          },
          {
            label: 'Participants',
            data: participantsData,
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)'
          }
        ]
      };
    } catch (error) {
      console.error('Error getting engagement trends:', error);
      return {
        labels: [],
        datasets: []
      };
    }
  }

  // Get participation heatmap data
  async getParticipationHeatmap(): Promise<{
    hour: number;
    day: number;
    value: number;
  }[]> {
    try {
      const { data: participation, error } = await supabase
        .from('session_participants')
        .select('joined_at')
        .gte('joined_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const heatmapData: { [key: string]: number } = {};

      participation?.forEach(p => {
        const date = new Date(p.joined_at);
        const hour = date.getHours();
        const day = date.getDay();
        const key = `${day}-${hour}`;
        heatmapData[key] = (heatmapData[key] || 0) + 1;
      });

      return Object.entries(heatmapData).map(([key, value]) => {
        const [day, hour] = key.split('-').map(Number);
        return { day, hour, value };
      });
    } catch (error) {
      console.error('Error getting participation heatmap:', error);
      return [];
    }
  }

  // Get question sentiment distribution
  async getQuestionSentimentDistribution(): Promise<{
    positive: number;
    neutral: number;
    negative: number;
  }> {
    try {
      const { data: questions, error } = await supabase
        .from('session_questions')
        .select('sentiment');

      if (error) throw error;

      const distribution = { positive: 0, neutral: 0, negative: 0 };

      questions?.forEach(q => {
        const sentiment = q.sentiment || 'neutral';
        distribution[sentiment as keyof typeof distribution]++;
      });

      return distribution;
    } catch (error) {
      console.error('Error getting question sentiment distribution:', error);
      return { positive: 0, neutral: 0, negative: 0 };
    }
  }

  // Helper methods
  private getStartDate(timeRange: 'day' | 'week' | 'month' | 'all'): string {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'all':
      default:
        return '1970-01-01T00:00:00Z';
    }
  }

  private calculateSessionDuration(startTime: string, endTime: string): number {
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    } catch (error) {
      return 0;
    }
  }
}

const analyticsService = new AnalyticsService();

export default analyticsService; 