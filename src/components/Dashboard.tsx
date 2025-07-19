import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../App';
import { supabase } from '../lib/supabase';
import Header from './Header';
import { TrendingUp, Users, Award, Calendar, MessageSquare, BarChart3, Clock, Star } from 'lucide-react';

interface RecentSession {
  id: string;
  title: string;
  date: string;
  time: string;
  engagement: number;
  attendees: number;
  status: string;
}

interface Achievement {
  icon: any;
  title: string;
  description: string;
  earned: boolean;
}

interface EngagementData {
  month: string;
  score: number;
}

const Dashboard: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Fetch user's recent session participation
      const { data: participation, error: participationError } = await supabase
        .from('session_participants')
        .select(`
          sessions (
            id,
            title,
            date,
            start_time,
            end_time,
            attendees,
            engagement_score,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(3);

      if (participationError) {
        console.error('Error fetching participation:', participationError);
        setError('Failed to load recent sessions');
        return;
      }

      // Process recent sessions
      const sessions = participation
        ?.filter(p => p.sessions)
        .map(p => ({
          id: (p.sessions as any).id,
          title: (p.sessions as any).title,
          date: (p.sessions as any).date,
          time: `${(p.sessions as any).start_time} - ${(p.sessions as any).end_time}`,
          engagement: (p.sessions as any).engagement_score || 0,
          attendees: (p.sessions as any).attendees || 0,
          status: (p.sessions as any).status
        })) || [];

      setRecentSessions(sessions);

      // Fetch user achievements
      const { data: userAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          achievements (
            name,
            description,
            icon
          )
        `)
        .eq('user_id', user.id);

      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
      }

      // Process achievements
      const allAchievements = [
        { icon: MessageSquare, title: 'Question Master', description: 'Asked 25+ questions', earned: false },
        { icon: TrendingUp, title: 'Engagement Leader', description: 'Top 10% engagement', earned: false },
        { icon: Users, title: 'Community Builder', description: '50+ connections made', earned: false },
        { icon: Star, title: 'Session Champion', description: 'Attend 100 sessions', earned: false }
      ];

      // Mark earned achievements
      const earnedAchievements = userAchievements?.map(ua => (ua.achievements as any).name) || [];
      const processedAchievements = allAchievements.map(achievement => ({
        ...achievement,
        earned: earnedAchievements.includes(achievement.title)
      }));

      setAchievements(processedAchievements);

      // Generate mock engagement data (in real app, this would come from analytics table)
      const mockEngagementData = [
        { month: 'Sep', score: 65 },
        { month: 'Oct', score: 72 },
        { month: 'Nov', score: 78 },
        { month: 'Dec', score: 85 },
        { month: 'Jan', score: 87 }
      ];
      setEngagementData(mockEngagementData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
              <p className="text-indigo-100">
                Ready to continue your learning journey? Here's what's happening today.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{user?.engagementScore || 0}%</div>
              <div className="text-indigo-100 text-sm">Engagement Score</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-indigo-100">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sessions Attended</p>
                <p className="text-2xl font-bold text-gray-900">{user?.totalEvents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                <p className="text-2xl font-bold text-gray-900">{user?.engagementScore || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Badges Earned</p>
                <p className="text-2xl font-bold text-gray-900">{user?.badges?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hours Learned</p>
                <p className="text-2xl font-bold text-gray-900">24.5h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Sessions */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
              <a href="/sessions" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                View all
              </a>
            </div>
            
            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent sessions</h3>
                <p className="text-gray-600 mb-4">Start by joining your first session</p>
                <a
                  href="/sessions"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Browse Sessions
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{session.title}</h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500 space-x-4">
                        <span>{new Date(session.date).toLocaleDateString()}</span>
                        <span>{session.time}</span>
                        <span>{session.attendees} attendees</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indigo-600">{session.engagement}%</div>
                      <div className="text-xs text-gray-500 capitalize">{session.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Achievements</h2>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div key={index} className={`flex items-center p-4 rounded-lg border ${
                  achievement.earned 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`p-2 rounded-lg mr-4 ${
                    achievement.earned ? 'bg-indigo-100' : 'bg-gray-100'
                  }`}>
                    <achievement.icon className={`w-5 h-5 ${
                      achievement.earned ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      achievement.earned ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {achievement.title}
                    </h3>
                    <p className={`text-sm ${
                      achievement.earned ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.earned && (
                    <div className="text-indigo-600">
                      <Award className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Engagement Trend</h2>
          <div className="h-64 flex items-end justify-center space-x-4">
            {engagementData.map((data, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className="w-12 bg-indigo-600 rounded-t-lg transition-all duration-300 hover:bg-indigo-700"
                  style={{ height: `${(data.score / 100) * 200}px` }}
                  title={`${data.month}: ${data.score}%`}
                ></div>
                <span className="text-sm text-gray-600 mt-2">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/sessions"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-indigo-100">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Join Sessions</h3>
            </div>
            <p className="text-gray-600">Discover and join engaging learning sessions</p>
          </a>

          <a
            href="/analytics"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-green-100">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">View Analytics</h3>
            </div>
            <p className="text-gray-600">Track your progress and engagement metrics</p>
          </a>

          <a
            href="/preferences"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Manage Profile</h3>
            </div>
            <p className="text-gray-600">Update your preferences and settings</p>
          </a>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;