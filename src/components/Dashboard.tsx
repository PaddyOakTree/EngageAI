import React, { useContext } from 'react';
import { AuthContext } from '../App';
import Header from './Header';
import { TrendingUp, Users, Award, Calendar, MessageSquare, BarChart3, Clock, Star } from 'lucide-react';

const Dashboard: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;

  const recentSessions = [
    {
      id: '1',
      title: 'AI & Machine Learning Summit 2025',
      date: '2025-01-20',
      time: '2:00 PM - 4:00 PM',
      engagement: 92,
      attendees: 247,
      status: 'completed'
    },
    {
      id: '2',
      title: 'Future of Work Conference',
      date: '2025-01-18',
      time: '10:00 AM - 12:00 PM',
      engagement: 88,
      attendees: 156,
      status: 'completed'
    },
    {
      id: '3',
      title: 'Tech Innovation Workshop',
      date: '2025-01-22',
      time: '3:00 PM - 5:00 PM',
      engagement: 0,
      attendees: 89,
      status: 'upcoming'
    }
  ];

  const achievements = [
    { icon: MessageSquare, title: 'Question Master', description: 'Asked 25+ questions', earned: true },
    { icon: TrendingUp, title: 'Engagement Leader', description: 'Top 10% engagement', earned: true },
    { icon: Users, title: 'Community Builder', description: '50+ connections made', earned: false },
    { icon: Star, title: 'Session Champion', description: 'Attend 100 sessions', earned: false }
  ];

  const engagementData = [
    { month: 'Sep', score: 65 },
    { month: 'Oct', score: 72 },
    { month: 'Nov', score: 78 },
    { month: 'Dec', score: 85 },
    { month: 'Jan', score: 87 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your engagement overview and upcoming events.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Engagement Score</p>
                <p className="text-2xl font-bold text-gray-900">{user?.engagementScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Events Attended</p>
                <p className="text-2xl font-bold text-gray-900">{user?.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Badges Earned</p>
                <p className="text-2xl font-bold text-gray-900">{user?.badges.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rank</p>
                <p className="text-2xl font-bold text-gray-900">#47</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Engagement Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Engagement Trend</h2>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-end justify-between space-x-4">
              {engagementData.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-indigo-600 rounded-t-lg"
                    style={{ height: `${(data.score / 100) * 200}px` }}
                  ></div>
                  <span className="text-sm text-gray-600 mt-2">{data.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h2>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`flex items-center p-3 rounded-lg ${
                    achievement.earned ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    achievement.earned ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <achievement.icon className={`w-4 h-4 ${
                      achievement.earned ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      achievement.earned ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {achievement.title}
                    </p>
                    <p className={`text-xs ${
                      achievement.earned ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{session.title}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {session.date}
                      <Clock className="w-4 h-4 ml-3 mr-1" />
                      {session.time}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{session.engagement}%</p>
                      <p className="text-xs text-gray-500">Engagement</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{session.attendees}</p>
                      <p className="text-xs text-gray-500">Attendees</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {session.status === 'completed' ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;