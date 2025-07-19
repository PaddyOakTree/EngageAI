import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { supabase } from '../lib/supabase';
import Header from './Header';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Award, 
  RefreshCw, 
  Download,
  MessageSquare,
  Users,
  Star,
  Brain,
  Target,
  Trophy
} from 'lucide-react';

interface AnalyticsData {
  date: string;
  engagement: number;
  sessions: number;
  questions: number;
}

interface SessionBreakdown {
  name: string;
  value: number;
  color: string;
}

interface TopSession {
  title: string;
  engagement: number;
  duration: string;
  questions: number;
  date: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  date: string;
  icon: string;
  earned: boolean;
  progress?: number;
  target?: number;
}

const AnalyticsPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('engagement');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [overviewStats, setOverviewStats] = useState<any[]>([]);
  const [sessionBreakdown, setSessionBreakdown] = useState<SessionBreakdown[]>([]);
  const [topSessions, setTopSessions] = useState<TopSession[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch user analytics data
      const { data: analytics, error: analyticsError } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', getDateFromRange(timeRange))
        .order('date', { ascending: true });

      if (analyticsError) throw analyticsError;

      // Fetch session participation data
      const { data: participation, error: participationError } = await supabase
        .from('session_participants')
        .select(`
          *,
          sessions (*)
        `)
        .eq('user_id', user.id)
        .gte('joined_at', getDateFromRange(timeRange));

      if (participationError) throw participationError;

      // Fetch user achievements
      const { data: userAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          earned_at,
          achievements (
            id,
            name,
            description,
            icon,
            criteria
          )
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (achievementsError) throw achievementsError;

      // Fetch all achievements to show progress
      const { data: allAchievements, error: allAchievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: true });

      if (allAchievementsError) throw allAchievementsError;

      // Calculate user statistics
      const stats = {
        sessions_attended: participation?.length || 0,
        total_time_spent: participation?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0,
        questions_asked: 0, // Will be calculated separately
        engagement_score: 0, // Will be calculated separately
        ai_insights: 0 // Will be calculated separately
      };

      // Fetch questions count
      const { data: questions, error: questionsError } = await supabase
        .from('session_questions')
        .select('id')
        .eq('user_id', user.id);

      if (!questionsError) {
        stats.questions_asked = questions?.length || 0;
      }

      // Fetch user profile for engagement score
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('engagement_score')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        stats.engagement_score = profile.engagement_score || 0;
      }

      // Process achievements with progress
      const processedAchievements = allAchievements?.map((achievement: any) => {
        const earned = userAchievements?.some((ua: any) => ua.achievements.id === achievement.id);
        let progress = 0;
        let target = 0;

        if (achievement.criteria?.type && achievement.criteria?.value) {
          target = achievement.criteria.value;
          
          switch (achievement.criteria.type) {
            case 'questions_asked':
              progress = Math.min(stats.questions_asked, target);
              break;
            case 'sessions_attended':
              progress = Math.min(stats.sessions_attended, target);
              break;
            case 'total_hours':
              progress = Math.min(stats.total_time_spent / 60, target);
              break;
            case 'engagement_score':
              progress = Math.min(stats.engagement_score, target);
              break;
            case 'ai_insights':
              progress = Math.min(stats.ai_insights, target);
              break;
          }
        }

        return {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          date: earned ? userAchievements?.find((ua: any) => ua.achievements.id === achievement.id)?.earned_at : null,
          icon: achievement.icon,
          earned: !!earned,
          progress: Math.round((progress / target) * 100),
          target
        };
      }) || [];

      setAchievements(processedAchievements);

      // Process analytics data
      const processedData = processAnalyticsData(analytics || []);
      setAnalyticsData(processedData);

      // Calculate overview stats
      const statsArray = calculateOverviewStats(analytics || [], participation || []);
      setOverviewStats(statsArray);

      // Calculate session breakdown
      const breakdown = calculateSessionBreakdown(participation || []);
      setSessionBreakdown(breakdown);

      // Process top sessions
      const topSessionsData = processTopSessions(participation || []);
      setTopSessions(topSessionsData);

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [user, timeRange]);

  const getDateFromRange = (range: string): string => {
    const now = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const pastDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return pastDate.toISOString().split('T')[0];
  };

  const processAnalyticsData = (data: any[]): AnalyticsData[] => {
    if (!data.length) {
      // Generate mock data for demonstration
      const mockData: AnalyticsData[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        mockData.push({
          date: date.toISOString().split('T')[0],
          engagement: Math.floor(Math.random() * 100),
          sessions: Math.floor(Math.random() * 5),
          questions: Math.floor(Math.random() * 10)
        });
      }
      return mockData;
    }

    return Object.values(data).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const calculateOverviewStats = (analytics: any[], _participation: any[]) => {
    const totalEngagement = analytics.reduce((sum, item) => sum + (item.engagement_score || 0), 0);
    const avgEngagement = analytics.length > 0 ? Math.round(totalEngagement / analytics.length) : 0;
    const totalSessions = analytics.reduce((sum, item) => sum + (item.sessions_attended || 0), 0);
    const totalHours = analytics.reduce((sum, item) => sum + (parseFloat(item.total_hours) || 0), 0);
    const totalBadges = analytics.reduce((sum, item) => sum + (item.badges_earned || 0), 0);

    return [
      {
        icon: TrendingUp,
        label: 'Avg Engagement',
        value: `${avgEngagement}%`,
        change: '+5.2%',
        trend: 'up',
        color: 'indigo'
      },
      {
        icon: Calendar,
        label: 'Sessions Attended',
        value: totalSessions.toString(),
        change: '+12%',
        trend: 'up',
        color: 'green'
      },
      {
        icon: Clock,
        label: 'Total Hours',
        value: `${totalHours.toFixed(1)}h`,
        change: '+8.3%',
        trend: 'up',
        color: 'blue'
      },
      {
        icon: Award,
        label: 'Badges Earned',
        value: totalBadges.toString(),
        change: '+2',
        trend: 'up',
        color: 'purple'
      }
    ];
  };

  const calculateSessionBreakdown = (_participation: any[]): SessionBreakdown[] => {
    // This would be calculated based on session types or categories
    // For now, using mock data structure
    return [
      { name: 'AI & ML Sessions', value: 35, color: 'bg-indigo-500' },
      { name: 'Web Development', value: 25, color: 'bg-blue-500' },
      { name: 'Data Science', value: 20, color: 'bg-green-500' },
      { name: 'Cybersecurity', value: 12, color: 'bg-purple-500' },
      { name: 'Other', value: 8, color: 'bg-gray-500' }
    ];
  };

  const processTopSessions = (_participation: any[]): TopSession[] => {
    return _participation
      .filter((p: any) => p.sessions)
      .map((p: any) => ({
        title: p.sessions.title,
        engagement: p.engagement_score || 0,
        duration: `${Math.round((p.time_spent || 0) / 60)}h ${(p.time_spent || 0) % 60}m`,
        questions: p.questions_asked || 0,
        date: p.sessions.date
      }))
      .sort((a: any, b: any) => b.engagement - a.engagement)
      .slice(0, 3);
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'Calendar': Calendar,
      'MessageSquare': MessageSquare,
      'TrendingUp': TrendingUp,
      'Award': Award,
      'Star': Star,
      'Clock': Clock,
      'Brain': Brain,
      'Users': Users,
      'Trophy': Trophy,
      'Target': Target
    };
    return iconMap[iconName] || Award;
  };

  const exportData = () => {
    const data = {
      user: user?.name,
      timeRange,
      stats: overviewStats,
      analyticsData,
      achievements,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engagement-analytics-${timeRange}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-600">Track your learning progress and engagement</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <button
              onClick={fetchAnalyticsData}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportData}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Time Range Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Time Range</h2>
            <div className="flex space-x-2">
              {['7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    timeRange === range
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overviewStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last period</span>
              </div>
            </div>
          ))}
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {achievements.filter(a => a.earned).length} of {achievements.length} earned
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const IconComponent = getIconComponent(achievement.icon);
              return (
                <div 
                  key={achievement.id} 
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    achievement.earned 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      achievement.earned 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold text-sm ${
                        achievement.earned ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {achievement.name}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {achievement.description}
                      </p>
                      {achievement.earned && achievement.date && (
                        <p className="text-xs text-green-600 mt-1">
                          Earned {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      )}
                      {!achievement.earned && achievement.progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${achievement.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Engagement Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Engagement Over Time</h3>
              <div className="flex space-x-2">
                {['engagement', 'sessions', 'questions'].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      selectedMetric === metric
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 flex items-end justify-center space-x-2">
              {analyticsData.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="w-8 bg-indigo-600 rounded-t-lg transition-all duration-300 hover:bg-indigo-700"
                    style={{
                      height: `${Math.max(10, (data[selectedMetric as keyof AnalyticsData] as number) / 100 * 200)}px`
                    }}
                    title={`${new Date(data.date).toLocaleDateString()}: ${
                      data[selectedMetric as keyof AnalyticsData]
                    }`}
                  ></div>
                  <span className="text-xs text-gray-500 mt-1">
                    {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Session Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Session Types</h3>
            <div className="space-y-4">
              {sessionBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full ${item.color} mr-3`}></div>
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Sessions */}
        {topSessions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Sessions</h3>
            <div className="space-y-4">
              {topSessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{session.title}</h4>
                      <p className="text-sm text-gray-600">{session.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{session.engagement}%</p>
                      <p className="text-xs text-gray-600">Engagement</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{session.duration}</p>
                      <p className="text-xs text-gray-600">Duration</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{session.questions}</p>
                      <p className="text-xs text-gray-600">Questions</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnalyticsPage;