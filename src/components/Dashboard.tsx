import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { supabase } from '../lib/supabase';
import Header from './Header';
import CreateSessionModal from './CreateSessionModal';
import Leaderboard from './Leaderboard';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award, 
  MessageSquare,
  CheckCircle,
  Circle,
  Plus
} from 'lucide-react';



interface QuickStat {
  icon: any;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

const Dashboard: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch upcoming sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .eq('status', 'upcoming')
        .order('date', { ascending: true })
        .limit(5);

      if (sessionsError) throw sessionsError;

      // Fetch user's session participation for recent activity
      const { data: participation, error: participationError } = await supabase
        .from('session_participants')
        .select(`
          *,
          sessions (*)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(5);

      if (participationError) throw participationError;



      // Calculate user statistics
      const stats = {
        sessions_attended: participation?.length || 0,
        total_time_spent: participation?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0,
        questions_asked: 0,
        engagement_score: 0,
        ai_insights: 0
      };

      // Fetch questions count
      const { data: questions, error: questionsError } = await supabase
        .from('session_questions')
        .select('id')
        .eq('user_id', user.id);

      if (!questionsError) {
        stats.questions_asked = questions?.length || 0;
      }

      // Fetch AI insights count
      const { data: aiInsights, error: aiInsightsError } = await supabase
        .from('ai_insights')
        .select('id')
        .eq('user_id', user.id);

      if (!aiInsightsError) {
        stats.ai_insights = aiInsights?.length || 0;
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

      // Fetch previous week's data for comparison
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const { data: prevParticipation } = await supabase
        .from('session_participants')
        .select('time_spent')
        .eq('user_id', user.id)
        .lt('joined_at', lastWeek.toISOString());

      const { data: prevQuestions } = await supabase
        .from('session_questions')
        .select('id')
        .eq('user_id', user.id)
        .lt('created_at', lastWeek.toISOString());

      // Calculate changes
      const prevSessionsCount = prevParticipation?.length || 0;
      const prevHours = (prevParticipation?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0) / 60;
      const prevQuestionsCount = prevQuestions?.length || 0;

      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 'New!' : 'No change';
        const change = ((current - previous) / previous) * 100;
        return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
      };

      const calculateTrend = (current: number, previous: number): 'up' | 'down' => {
        return current >= previous ? 'up' : 'down';
      };



      // Set quick stats with real calculated changes
      const currentHours = stats.total_time_spent / 60;
      const earnedAchievements = 0; // Achievements component removed
      
      const statsArray: QuickStat[] = [
        {
          icon: Calendar,
          label: 'Sessions Attended',
          value: stats.sessions_attended.toString(),
          change: calculateChange(stats.sessions_attended, prevSessionsCount),
          trend: calculateTrend(stats.sessions_attended, prevSessionsCount)
        },
        {
          icon: Clock,
          label: 'Total Hours',
          value: `${currentHours.toFixed(1)}h`,
          change: calculateChange(currentHours, prevHours),
          trend: calculateTrend(currentHours, prevHours)
        },
        {
          icon: MessageSquare,
          label: 'Questions Asked',
          value: stats.questions_asked.toString(),
          change: calculateChange(stats.questions_asked, prevQuestionsCount),
          trend: calculateTrend(stats.questions_asked, prevQuestionsCount)
        },
        {
          icon: Award,
          label: 'Achievements',
          value: earnedAchievements.toString(),
          change: earnedAchievements > 0 ? 'New!' : 'No change',
          trend: 'up'
        }
      ];

      setQuickStats(statsArray);
      setUpcomingSessions(sessions || []);
      setRecentActivity(participation || []);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);



  const joinSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          joined_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error joining session:', error);
        alert('Failed to join session');
        return;
      }

      // Refresh dashboard data
      fetchDashboardData();
      alert('Successfully joined session!');
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Failed to join session');
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your learning journey today.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-100">
                  <stat.icon className="w-6 h-6 text-indigo-600" />
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
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upcoming Sessions & Recent Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
                <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                  View all
                </button>
              </div>
              
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{session.title}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(session.date).toLocaleDateString()} at {session.start_time}
                          </p>
                          <p className="text-sm text-gray-500">{session.organizer}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => joinSession(session.id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming sessions</p>
                  <p className="text-sm text-gray-400">Check back later for new sessions</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
              
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          Joined "{activity.sessions?.title || 'Session'}"
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(activity.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {Math.round((activity.time_spent || 0) / 60)}h {(activity.time_spent || 0) % 60}m
                        </p>
                        <p className="text-xs text-gray-500">Time spent</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Circle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400">Join your first session to see activity here</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Mini Leaderboard */}
            <Leaderboard limit={5} showCurrentUser={true} />
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              
              <div className="space-y-3">
                {/* Common actions for all roles */}
                <button className="w-full flex items-center justify-between p-3 text-left bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-gray-900">Browse Sessions</span>
                  </div>
                  <span className="text-sm text-gray-500">→</span>
                </button>
                
                {/* Role-specific actions */}
                {user?.role === 'student' && (
                  <>
                    <button className="w-full flex items-center justify-between p-3 text-left bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-900">Ask Questions</span>
                      </div>
                      <span className="text-sm text-gray-500">→</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 text-left bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">View My Progress</span>
                      </div>
                      <span className="text-sm text-gray-500">→</span>
                    </button>
                  </>
                )}
                
                {user?.role === 'moderator' && (
                  <>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="w-full flex items-center justify-between p-3 text-left bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Plus className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-900">Create Session</span>
                      </div>
                      <span className="text-sm text-gray-500">→</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 text-left bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Award className="w-5 h-5 text-orange-600" />
                        <span className="font-medium text-gray-900">Manage Sessions</span>
                      </div>
                      <span className="text-sm text-gray-500">→</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 text-left bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-900">View Analytics</span>
                      </div>
                      <span className="text-sm text-gray-500">→</span>
                    </button>
                  </>
                )}
                
                {user?.role === 'admin' && (
                  <>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="w-full flex items-center justify-between p-3 text-left bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Plus className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-900">Create Session</span>
                      </div>
                      <span className="text-sm text-gray-500">→</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 text-left bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Award className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-gray-900">Admin Dashboard</span>
                      </div>
                      <span className="text-sm text-gray-500">→</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 text-left bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-gray-900">System Analytics</span>
                      </div>
                      <span className="text-sm text-gray-500">→</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Manage Users</span>
                      </div>
                      <span className="text-sm text-gray-500">→</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Session Modal */}
        <CreateSessionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSessionCreated={fetchDashboardData}
        />
      </main>
    </div>
  );
};

export default Dashboard;