import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { supabase } from '../lib/supabase';
import Header from './Header';
import { Video, Users, MessageSquare, TrendingUp, Brain, Mic, MicOff, Camera, CameraOff, Settings, Share2, ArrowLeft } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  organizer: string;
  start_time: string;
  end_time: string;
  attendees: number;
  engagement_score: number;
  status: string;
  type: string;
  location?: string;
  meeting_url?: string;
  description?: string;
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
  engagement: number;
}

interface Question {
  id: string;
  user: string;
  question: string;
  time: string;
  sentiment: string;
}

const SessionView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user;
  
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [engagementScore, setEngagementScore] = useState(0);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isParticipating, setIsParticipating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSessionData();
    }
  }, [id]);

  const fetchSessionData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      // Fetch session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        setError('Failed to load session');
        return;
      }

      setSession(sessionData);

      // Check if user is participating
      if (user) {
        const { data: participation } = await supabase
          .from('session_participants')
          .select('id')
          .eq('session_id', id)
          .eq('user_id', user.id)
          .single();

        setIsParticipating(!!participation);
      }

             // Fetch participants
       const { data: participantsData, error: participantsError } = await supabase
         .from('session_participants')
         .select(`
           engagement_score,
           profiles (
             name,
             avatar_url
           )
         `)
         .eq('session_id', id)
         .limit(10);

       if (participantsError) {
         console.error('Error fetching participants:', participantsError);
       } else {
         const processedParticipants = participantsData
           ?.filter(p => p.profiles)
           .map(p => ({
             id: (p.profiles as any).name,
             name: (p.profiles as any).name,
             avatar: (p.profiles as any).avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
             engagement: p.engagement_score || 0
           })) || [];
         setParticipants(processedParticipants);
       }

       // Fetch questions
       const { data: questionsData, error: questionsError } = await supabase
         .from('session_questions')
         .select(`
           question,
           sentiment,
           created_at,
           profiles (
             name
           )
         `)
         .eq('session_id', id)
         .order('created_at', { ascending: false })
         .limit(10);

       if (questionsError) {
         console.error('Error fetching questions:', questionsError);
       } else {
         const processedQuestions = questionsData
           ?.filter(q => q.profiles)
           .map(q => ({
             id: q.created_at,
             user: (q.profiles as any).name,
             question: q.question,
             time: new Date(q.created_at).toLocaleTimeString('en-US', { 
               hour: '2-digit', 
               minute: '2-digit' 
             }),
             sentiment: q.sentiment || 'neutral'
           })) || [];
         setQuestions(processedQuestions);
       }

      // Set engagement score
      setEngagementScore(sessionData.engagement_score || 0);

      // Generate AI insights
      generateAiInsights();

    } catch (error) {
      console.error('Error fetching session data:', error);
      setError('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const generateAiInsights = () => {
    const insights = [
      'High engagement detected during technical demonstrations',
      'Participants showing strong interest in practical applications',
      'Questions trend toward implementation details',
      'Positive sentiment in chat discussions',
      'Active participation in Q&A sessions',
      'Strong focus on hands-on learning'
    ];
    
    const interval = setInterval(() => {
      const randomInsight = insights[Math.floor(Math.random() * insights.length)];
      setAiInsights(prev => [...prev.slice(-2), randomInsight]);
    }, 5000);

    return () => clearInterval(interval);
  };

  const joinSession = async () => {
    if (!user || !session) return;

    try {
      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: session.id,
          user_id: user.id
        });

      if (error) {
        console.error('Error joining session:', error);
        alert('Failed to join session');
        return;
      }

      setIsParticipating(true);
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

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h2>
            <p className="text-gray-600 mb-6">The session you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/sessions')}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Session Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
              <p className="text-gray-600 mt-1">
                Hosted by {session.organizer} • {session.start_time} - {session.end_time}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{session.attendees}</p>
                <p className="text-sm text-gray-600">Attendees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{session.engagement_score}%</p>
                <p className="text-sm text-gray-600">Engagement</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                session.status === 'live' ? 'bg-green-100 text-green-800' :
                session.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                {session.meeting_url ? (
                  <iframe
                    src={session.meeting_url}
                    className="w-full h-full rounded-lg"
                    allow="camera; microphone; fullscreen; speaker; display-capture"
                  />
                ) : (
                  <div className="text-center text-white">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Session Video</p>
                    <p className="text-sm opacity-75">Video will appear here when session starts</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setIsAudioOn(!isAudioOn)}
                  className={`p-3 rounded-full ${isAudioOn ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-3 rounded-full ${isVideoOn ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  {isVideoOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                </button>
                <button className="p-3 rounded-full bg-gray-200 text-gray-700">
                  <Settings className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-full bg-gray-200 text-gray-700">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Join Session Button */}
              {!isParticipating && session.status === 'upcoming' && (
                <div className="mt-6 text-center">
                  <button
                    onClick={joinSession}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Join Session
                  </button>
                </div>
              )}
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <Brain className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
              </div>
              <div className="space-y-2">
                {aiInsights.map((insight, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center">
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                      <p className="text-xs text-gray-500">{participant.engagement}% engagement</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                <MessageSquare className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {questions.map((question) => (
                  <div key={question.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">{question.user}</p>
                      <span className="text-xs text-gray-500">{question.time}</span>
                    </div>
                    <p className="text-sm text-gray-600">{question.question}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        question.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        question.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {question.sentiment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Score */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Engagement</h3>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">{engagementScore}%</div>
                <p className="text-sm text-gray-600">Current engagement score</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionView;