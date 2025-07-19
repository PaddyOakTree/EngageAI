import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import Header from './Header';
import { BarChart3, TrendingUp, Users, Calendar, MessageSquare, Award, Download, Filter, RefreshCw, Eye, Clock, Target } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('engagement');

  // Mock analytics data
  const overviewStats = [
    {
      icon: TrendingUp,
      label: 'Avg Engagement',
      value: '87%',
      change: '+5.2%',
      trend: 'up',
      color: 'indigo'
    },
    {
      icon: Calendar,
      label: 'Sessions Attended',
      value: '24',
      change: '+12%',
      trend: 'up',
      color: 'green'
    },
    {
      icon: Clock,
      label: 'Total Hours',
      value: '48.5h',
      change: '+8.3%',
      trend: 'up',
      color: 'blue'
    },
    {
      icon: Award,
      label: 'Badges Earned',
      value: '7',
      change: '+2',
      trend: 'up',
      color: 'purple'
    }
  ];

  const engagementData = [
    { date: '2025-01-01', engagement: 75, sessions: 2, questions: 5 },
    { date: '2025-01-02', engagement: 82, sessions: 1, questions: 3 },
    { date: '2025-01-03', engagement: 78, sessions: 3, questions: 8 },
    { date: '2025-01-04', engagement: 85, sessions: 2, questions: 6 },
    { date: '2025-01-05', engagement: 91, sessions: 1, questions: 4 },
    { date: '2025-01-06', engagement: 88, sessions: 2, questions: 7 },
    { date: '2025-01-07', engagement: 93, sessions: 3, questions: 9 }
  ];

  const sessionBreakdown = [
    { name: 'AI & ML Sessions', value: 35, color: 'bg-indigo-500' },
    { name: 'Web Development', value: 25, color: 'bg-blue-500' },
    { name: 'Data Science', value: 20, color: 'bg-green-500' },
    { name: 'Cybersecurity', value: 12, color: 'bg-purple-500' },
    { name: 'Other', value: 8, color: 'bg-gray-500' }
  ];

  const topSessions = [
    {
      title: 'AI & Machine Learning Summit',
      engagement: 95,
      duration: '4h 15m',
      questions: 12,
      date: '2025-01-20'
    },
    {
      title: 'React Advanced Patterns',
      engagement: 92,
      duration: '2h 30m',
      questions: 8,
      date: '2025-01-18'
    },
    {
      title: 'Data Visualization Workshop',
      engagement: 89,
      duration: '3h 45m',
      questions: 15,
      date: '2025-01-15'
    }
  ];

  const achievements = [
    { name: 'Question Master', description: 'Asked 25+ questions', date: '2025-01-20', icon: MessageSquare },
    { name: 'Engagement Leader', description: 'Top 10% engagement', date: '2025-01-18', icon: TrendingUp },
    { name: 'Session Enthusiast', description: 'Attended 20+ sessions', date: '2025-01-15', icon: Calendar },
    { name: 'Knowledge Seeker', description: 'Completed 5 workshops', date: '2025-01-12', icon: Award }
  ];

  const exportData = () => {
    // Mock export functionality
    const data = {
      user: user?.name,
      timeRange,
      stats: overviewStats,
      engagementData,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Track your engagement patterns and learning progress
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={exportData}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                    <span className={`ml-2 text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Engagement Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Engagement Trend</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="text-sm px-3 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="engagement">Engagement %</option>
                  <option value="sessions">Sessions</option>
                  <option value="questions">Questions</option>
                </select>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {engagementData.map((data, index) => {
                const value = selectedMetric === 'engagement' ? data.engagement : 
                             selectedMetric === 'sessions' ? data.sessions * 20 : 
                             data.questions * 10;
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-indigo-600 rounded-t-lg transition-all duration-300 hover:bg-indigo-700"
                      style={{ height: `${(value / 100) * 200}px` }}
                      title={`${new Date(data.date).toLocaleDateString()}: ${
                        selectedMetric === 'engagement' ? `${data.engagement}%` :
                        selectedMetric === 'sessions' ? `${data.sessions} sessions` :
                        `${data.questions} questions`
                      }`}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2">
                      {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session Categories */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Session Categories</h2>
            <div className="space-y-4">
              {sessionBreakdown.map((category, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    <span className="text-sm text-gray-500">{category.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${category.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Sessions and Recent Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Top Performing Sessions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Performing Sessions</h2>
              <Eye className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {topSessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{session.title}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500 space-x-4">
                      <span>{session.date}</span>
                      <span>{session.duration}</span>
                      <span>{session.questions} questions</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-600">{session.engagement}%</div>
                    <div className="text-xs text-gray-500">engagement</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Achievements</h2>
              <Award className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg mr-4">
                    <achievement.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{achievement.name}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(achievement.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 mr-3" />
            <h2 className="text-lg font-semibold">AI-Powered Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <h3 className="font-medium mb-2">Peak Engagement</h3>
              <p className="text-sm opacity-90">
                Your engagement is highest during afternoon sessions (2-4 PM). Consider scheduling more learning during this time.
              </p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <h3 className="font-medium mb-2">Learning Pattern</h3>
              <p className="text-sm opacity-90">
                You show strong engagement in AI/ML topics. Explore advanced machine learning workshops for continued growth.
              </p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <h3 className="font-medium mb-2">Participation Goal</h3>
              <p className="text-sm opacity-90">
                You're 3 questions away from the "Curious Mind" badge. Keep asking thoughtful questions!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;