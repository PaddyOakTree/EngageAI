import React, { useState } from 'react';
import Header from './Header';
import { Users, TrendingUp, Calendar, MessageSquare, Brain, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const overviewStats = [
    { icon: Users, label: 'Total Users', value: '2,547', change: '+12%', color: 'blue' },
    { icon: Calendar, label: 'Active Sessions', value: '89', change: '+5%', color: 'green' },
    { icon: TrendingUp, label: 'Avg Engagement', value: '84%', change: '+3%', color: 'indigo' },
    { icon: MessageSquare, label: 'AI Insights', value: '1,234', change: '+18%', color: 'purple' }
  ];

  const recentSessions = [
    {
      id: '1',
      title: 'AI Summit 2025',
      organizer: 'Dr. Sarah Chen',
      attendees: 247,
      engagement: 92,
      duration: '4h 15m',
      status: 'live',
      aiModels: ['Gemini', 'Groq']
    },
    {
      id: '2',
      title: 'Future of Work',
      organizer: 'Microsoft Teams',
      attendees: 156,
      engagement: 88,
      duration: '2h 30m',
      status: 'completed',
      aiModels: ['Cohere', 'Gemini']
    },
    {
      id: '3',
      title: 'Tech Innovation',
      organizer: 'Google Meet',
      attendees: 89,
      engagement: 91,
      duration: '3h 45m',
      status: 'scheduled',
      aiModels: ['Groq']
    }
  ];

  const aiModelStats = [
    { name: 'Gemini', requests: 15420, uptime: '99.8%', avgResponse: '120ms', status: 'healthy' },
    { name: 'Groq', requests: 12330, uptime: '99.9%', avgResponse: '85ms', status: 'healthy' },
    { name: 'Cohere', requests: 8750, uptime: '98.5%', avgResponse: '200ms', status: 'warning' }
  ];

  const engagementData = [
    { day: 'Mon', engagement: 82 },
    { day: 'Tue', engagement: 85 },
    { day: 'Wed', engagement: 78 },
    { day: 'Thu', engagement: 91 },
    { day: 'Fri', engagement: 88 },
    { day: 'Sat', engagement: 76 },
    { day: 'Sun', engagement: 84 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor platform performance, manage users, and oversee AI integrations.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'sessions', name: 'Sessions' },
              { id: 'ai-models', name: 'AI Models' },
              { id: 'users', name: 'Users' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-${stat.color}-100`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <div className="flex items-center">
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <span className="ml-2 text-sm font-medium text-green-600">{stat.change}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Engagement Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Weekly Engagement Trends</h2>
              <div className="h-64 flex items-end justify-between space-x-4">
                {engagementData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-indigo-600 rounded-t-lg"
                      style={{ height: `${(data.engagement / 100) * 200}px` }}
                    ></div>
                    <span className="text-sm text-gray-600 mt-2">{data.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Session Management</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{session.title}</h3>
                        <p className="text-sm text-gray-500">Organized by {session.organizer}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-sm text-gray-600">{session.attendees} attendees</span>
                          <span className="text-sm text-gray-600">{session.engagement}% engagement</span>
                          <span className="text-sm text-gray-600">{session.duration}</span>
                        </div>
                        <div className="flex items-center mt-2">
                          <span className="text-xs text-gray-500 mr-2">AI Models:</span>
                          {session.aiModels.map((model, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1"
                            >
                              {model}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === 'live' 
                            ? 'bg-green-100 text-green-800' 
                            : session.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {session.status}
                        </span>
                        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Models Tab */}
        {activeTab === 'ai-models' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">AI Model Performance</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {aiModelStats.map((model, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Brain className="w-8 h-8 text-indigo-600 mr-3" />
                        <h3 className="font-medium text-gray-900">{model.name}</h3>
                      </div>
                      {model.status === 'healthy' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Requests</span>
                        <span className="text-sm font-medium">{model.requests.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Uptime</span>
                        <span className="text-sm font-medium">{model.uptime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Response</span>
                        <span className="text-sm font-medium">{model.avgResponse}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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