import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { supabase } from '../lib/supabase';
import Header from './Header';
import { Users, TrendingUp, Calendar, MessageSquare, Brain, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeSessions: number;
  avgEngagement: number;
  aiInsights: number;
}

interface RecentSession {
  id: string;
  title: string;
  organizer: string;
  attendees: number;
  engagement: number;
  duration: string;
  status: string;
  aiModels: string[];
}

interface AIModelStats {
  name: string;
  requests: number;
  uptime: string;
  avgResponse: string;
  status: string;
}

const AdminDashboard: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overviewStats, setOverviewStats] = useState<AdminStats>({
    totalUsers: 0,
    activeSessions: 0,
    avgEngagement: 0,
    aiInsights: 0
  });
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [aiModelStats, setAiModelStats] = useState<AIModelStats[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch total users
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (userError) {
        console.error('Error fetching user count:', userError);
      }

      // Fetch active sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .in('status', ['live', 'upcoming'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
      }

      // Calculate average engagement
      const { data: engagementData, error: engagementError } = await supabase
        .from('sessions')
        .select('engagement_score')
        .not('engagement_score', 'is', null);

      if (engagementError) {
        console.error('Error fetching engagement data:', engagementError);
      }

      const avgEngagement = engagementData && engagementData.length > 0
        ? Math.round(engagementData.reduce((sum, session) => sum + (session.engagement_score || 0), 0) / engagementData.length)
        : 0;

      // Fetch AI insights count (from session_questions)
      const { count: insightsCount, error: insightsError } = await supabase
        .from('session_questions')
        .select('*', { count: 'exact', head: true });

      if (insightsError) {
        console.error('Error fetching insights count:', insightsError);
      }

      setOverviewStats({
        totalUsers: userCount || 0,
        activeSessions: sessions?.length || 0,
        avgEngagement: avgEngagement,
        aiInsights: insightsCount || 0
      });

      // Process recent sessions
      const processedSessions = sessions?.map(session => ({
        id: session.id,
        title: session.title,
        organizer: session.organizer,
        attendees: session.attendees || 0,
        engagement: session.engagement_score || 0,
        duration: '2h 30m', // This would be calculated from start/end times
        status: session.status,
        aiModels: session.ai_models || []
      })) || [];

      setRecentSessions(processedSessions);

      // Mock AI model stats (in real app, this would come from AI service logs)
      const mockAiStats = [
        { name: 'Gemini', requests: 15420, uptime: '99.8%', avgResponse: '120ms', status: 'healthy' },
        { name: 'Groq', requests: 12330, uptime: '99.9%', avgResponse: '85ms', status: 'healthy' },
        { name: 'Cohere', requests: 8750, uptime: '98.5%', avgResponse: '200ms', status: 'warning' }
      ];
      setAiModelStats(mockAiStats);

      // Mock engagement data
      const mockEngagementData = [
        { day: 'Mon', engagement: 82 },
        { day: 'Tue', engagement: 85 },
        { day: 'Wed', engagement: 78 },
        { day: 'Thu', engagement: 91 },
        { day: 'Fri', engagement: 88 },
        { day: 'Sat', engagement: 76 },
        { day: 'Sun', engagement: 84 }
      ];
      setEngagementData(mockEngagementData);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor platform performance and user engagement</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'ai'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AI Models
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{overviewStats.totalUsers.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{overviewStats.activeSessions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-indigo-100">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                    <p className="text-2xl font-bold text-gray-900">{overviewStats.avgEngagement}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">AI Insights</p>
                    <p className="text-2xl font-bold text-gray-900">{overviewStats.aiInsights.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Sessions</h2>
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{session.title}</h3>
                      <p className="text-sm text-gray-500">by {session.organizer}</p>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{session.attendees}</p>
                        <p className="text-xs text-gray-500">Attendees</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{session.engagement}%</p>
                        <p className="text-xs text-gray-500">Engagement</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{session.duration}</p>
                        <p className="text-xs text-gray-500">Duration</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'live' ? 'bg-green-100 text-green-800' :
                        session.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Weekly Engagement</h2>
              <div className="h-64 flex items-end justify-center space-x-4">
                {engagementData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="w-12 bg-indigo-600 rounded-t-lg transition-all duration-300 hover:bg-indigo-700"
                      style={{ height: `${(data.engagement / 100) * 200}px` }}
                      title={`${data.day}: ${data.engagement}%`}
                    ></div>
                    <span className="text-sm text-gray-600 mt-2">{data.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Models Tab */}
        {activeTab === 'ai' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">AI Model Performance</h2>
            <div className="space-y-4">
              {aiModelStats.map((model, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      model.status === 'healthy' ? 'bg-green-500' :
                      model.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <div>
                      <h3 className="font-medium text-gray-900">{model.name}</h3>
                      <p className="text-sm text-gray-500">{model.requests.toLocaleString()} requests</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{model.uptime}</p>
                      <p className="text-xs text-gray-500">Uptime</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{model.avgResponse}</p>
                      <p className="text-xs text-gray-500">Avg Response</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      model.status === 'healthy' ? 'bg-green-100 text-green-800' :
                      model.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Management Coming Soon</h3>
                <p className="text-gray-600">
                  Advanced user management features will be available in the next update.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;