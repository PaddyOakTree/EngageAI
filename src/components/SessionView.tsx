import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import { Video, Users, MessageSquare, TrendingUp, Brain, Mic, MicOff, Camera, CameraOff, Settings, Share2 } from 'lucide-react';

const SessionView: React.FC = () => {
  const { id } = useParams();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [engagementScore, setEngagementScore] = useState(78);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  // Mock session data
  const session = {
    id: id,
    title: 'AI & Machine Learning Summit 2025',
    organizer: 'Dr. Sarah Chen',
    startTime: '2:00 PM',
    endTime: '4:00 PM',
    attendees: 247,
    currentEngagement: 84
  };

  const participants = [
    { id: '1', name: 'John Doe', avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop', engagement: 92 },
    { id: '2', name: 'Sarah Wilson', avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop', engagement: 88 },
    { id: '3', name: 'Mike Chen', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop', engagement: 95 }
  ];

  const questions = [
    { id: '1', user: 'Alice Johnson', question: 'How does transformer architecture differ from RNNs?', time: '2:15 PM', sentiment: 'positive' },
    { id: '2', user: 'Bob Smith', question: 'What are the ethical implications of large language models?', time: '2:18 PM', sentiment: 'neutral' },
    { id: '3', user: 'Carol Davis', question: 'Can you share more resources about implementation?', time: '2:22 PM', sentiment: 'positive' }
  ];

  useEffect(() => {
    // Simulate real-time AI insights
    const insights = [
      'High engagement detected during technical demonstrations',
      'Participants showing strong interest in practical applications',
      'Questions trend toward implementation details',
      'Positive sentiment in chat discussions'
    ];
    
    const interval = setInterval(() => {
      const randomInsight = insights[Math.floor(Math.random() * insights.length)];
      setAiInsights(prev => [...prev.slice(-2), randomInsight]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Session Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
              <p className="text-gray-600 mt-1">
                Hosted by {session.organizer} • {session.startTime} - {session.endTime}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{session.attendees}</p>
                <p className="text-sm text-gray-600">Attendees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{session.currentEngagement}%</p>
                <p className="text-sm text-gray-600">Engagement</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Live
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-3">
            <div className="bg-black rounded-xl aspect-video relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Live Session Stream</p>
                  <p className="text-sm opacity-75">Connected via Zoom Integration</p>
                </div>
              </div>
              
              {/* Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                <button
                  onClick={() => setIsAudioOn(!isAudioOn)}
                  className={`p-3 rounded-full ${isAudioOn ? 'bg-gray-700' : 'bg-red-600'} text-white hover:opacity-80 transition-opacity`}
                >
                  {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-3 rounded-full ${isVideoOn ? 'bg-gray-700' : 'bg-red-600'} text-white hover:opacity-80 transition-opacity`}
                >
                  {isVideoOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                </button>
                <button className="p-3 rounded-full bg-gray-700 text-white hover:opacity-80 transition-opacity">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-full bg-gray-700 text-white hover:opacity-80 transition-opacity">
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              {/* Engagement Score Overlay */}
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-lg p-3 text-white">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Your Engagement: {engagementScore}%</span>
                </div>
              </div>
            </div>

            {/* AI Insights Panel */}
            <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <Brain className="w-5 h-5 text-indigo-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Real-time AI Insights</h2>
              </div>
              <div className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <div key={index} className="flex items-start p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-sm text-indigo-800">{insight}</p>
                  </div>
                ))}
                {aiInsights.length === 0 && (
                  <p className="text-gray-500 text-sm">AI insights will appear here during the session...</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Participants</h2>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        src={participant.avatar}
                        alt={participant.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">{participant.name}</span>
                    </div>
                    <span className="text-xs font-medium text-green-600">{participant.engagement}%</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">+{session.attendees - participants.length} more participants</p>
                </div>
              </div>
            </div>

            {/* Q&A */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Q&A</h2>
                <MessageSquare className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="border-l-4 border-indigo-200 pl-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-900">{q.user}</span>
                      <span className="text-xs text-gray-500">{q.time}</span>
                    </div>
                    <p className="text-sm text-gray-700">{q.question}</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                      q.sentiment === 'positive' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {q.sentiment} sentiment
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionView;