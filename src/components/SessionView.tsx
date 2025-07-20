import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { supabase } from '../lib/supabase';
import { aiService, AIInsight } from '../lib/aiService';
import Header from './Header';
import { Video, Users, MessageSquare, TrendingUp, Brain, Mic, MicOff, Camera, CameraOff, Settings, Share2, ArrowLeft } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  organizer: string;
  organizer_id: string;
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
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isParticipating, setIsParticipating] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isSessionLive, setIsSessionLive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [sessionAnalytics, setSessionAnalytics] = useState({
    totalQuestions: 0,
    avgEngagement: 0,
    participationRate: 0,
    sessionDuration: 0
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSessionData();
    }
  }, [id]);

  // Real-time subscription to session updates
  useEffect(() => {
    if (!id) return;

    const subscription = supabase
      .channel(`session-${id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sessions',
          filter: `id=eq.${id}`
        }, 
        (payload) => {
          console.log('Session update:', payload);
          if (payload.eventType === 'UPDATE') {
            setSession(payload.new as Session);
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'session_questions',
          filter: `session_id=eq.${id}`
        }, 
        (payload) => {
          console.log('Question update:', payload);
          if (payload.eventType === 'INSERT') {
            fetchSessionData(); // Refresh questions
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'session_participants',
          filter: `session_id=eq.${id}`
        }, 
        (payload) => {
          console.log('Participant update:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            fetchSessionData(); // Refresh participants
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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

      // Generate AI insights with real data
      if (user) {
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

        const processedParticipants = participantsData
          ?.filter(p => p.profiles)
          .map(p => ({
            id: (p.profiles as any).name,
            name: (p.profiles as any).name,
            avatar: (p.profiles as any).avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
            engagement: p.engagement_score || 0
          })) || [];

        generateAiInsights(sessionData, processedQuestions, processedParticipants);
      }

    } catch (error) {
      console.error('Error fetching session data:', error);
      setError('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const generateAiInsights = async (sessionData: any, questions: Question[], participants: Participant[]) => {
    if (!user) return;

    setLoadingInsights(true);
    try {
      // Prepare session data for AI analysis
      const analysisData = {
        ...sessionData,
        questionCount: questions.length,
        participantCount: participants.length,
        recentQuestions: questions.slice(0, 5).map(q => ({
          question: q.question,
          sentiment: q.sentiment
        })),
        avgParticipantEngagement: participants.length > 0 
          ? participants.reduce((sum, p) => sum + p.engagement, 0) / participants.length 
          : 0
      };

      // Generate AI insights
      const insights = await aiService.generateSessionInsights(analysisData, user.id);
      setAiInsights(insights);

      // Analyze recent questions for sentiment if any exist
      if (questions.length > 0) {
        const recentQuestion = questions[0];
        const analysis = await aiService.analyzeQuestion(recentQuestion.question, user.id);
        
        // Add insight about question sentiment if it's notable
        if (analysis.sentiment.confidence > 0.7) {
          const sentimentInsight: AIInsight = {
            type: 'content',
            message: `Recent question shows ${analysis.sentiment.sentiment} sentiment (${Math.round(analysis.sentiment.confidence * 100)}% confidence)`,
            confidence: analysis.sentiment.confidence,
            timestamp: new Date().toISOString()
          };
          setAiInsights(prev => [...prev, sentimentInsight]);
        }
      }
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      // Fallback to basic insights
      setAiInsights([
        {
          type: 'engagement',
          message: 'Session engagement tracking active',
          confidence: 0.8,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoadingInsights(false);
    }
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

  const startSession = async () => {
    if (!session || !user) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: 'live',
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) {
        console.error('Error starting session:', error);
        alert('Failed to start session');
        return;
      }

      setIsSessionLive(true);
      setSessionStartTime(new Date());
      alert('Session started successfully!');
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session');
    }
  };

  const endSession = async () => {
    if (!session || !user) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) {
        console.error('Error ending session:', error);
        alert('Failed to end session');
        return;
      }

      setIsSessionLive(false);
      setSessionEndTime(new Date());
      alert('Session ended successfully!');
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session');
    }
  };

  const askQuestion = async (questionText: string) => {
    if (!session || !user) return;

    try {
      const { error } = await supabase
        .from('session_questions')
        .insert({
          session_id: session.id,
          user_id: user.id,
          question: questionText,
          sentiment: 'neutral',
          answered: false
        });

      if (error) {
        console.error('Error asking question:', error);
        alert('Failed to ask question');
        return;
      }

      // Refresh questions list
      fetchSessionData();
      setNewQuestion('');
      setShowQuestionInput(false);
      alert('Question submitted successfully!');
    } catch (error) {
      console.error('Error asking question:', error);
      alert('Failed to ask question');
    }
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestion.trim()) {
      askQuestion(newQuestion.trim());
    }
  };

  const generateSessionReport = async () => {
    if (!session) return;

    try {
      const reportData = {
        sessionId: session.id,
        title: session.title,
        organizer: session.organizer,
        date: session.start_time, // Assuming start_time is the date
        duration: sessionAnalytics.sessionDuration,
        totalParticipants: participants.length,
        totalQuestions: sessionAnalytics.totalQuestions,
        avgEngagement: sessionAnalytics.avgEngagement,
        participationRate: sessionAnalytics.participationRate,
        questions: questions,
        insights: aiInsights
      };

      // Generate downloadable report
      const reportBlob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-report-${session.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Session report downloaded successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  };

  const updateSessionAnalytics = () => {
    if (!session) return;

    const totalQuestions = questions.length;
    const avgEngagement = participants.length > 0 
      ? participants.reduce((sum, p) => sum + p.engagement, 0) / participants.length 
      : 0;
    const participationRate = session.attendees 
      ? (participants.length / session.attendees) * 100 
      : 0;
    
    // Calculate session duration (mock calculation)
    const sessionDuration = 90; // minutes

    setSessionAnalytics({
      totalQuestions,
      avgEngagement,
      participationRate,
      sessionDuration
    });
  };

  useEffect(() => {
    updateSessionAnalytics();
  }, [questions, participants, session]);

  const startRecording = async () => {
    if (!session) return;

    try {
      setIsRecording(true);
      // In a real implementation, this would integrate with a recording service
      // For now, we'll simulate recording
      setTimeout(() => {
        setRecordingUrl('https://example.com/recording.mp4');
        setIsRecording(false);
      }, 3000);

      alert('Recording started!');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!session) return;

    try {
      setIsRecording(false);
      alert('Recording stopped!');
    } catch (error) {
      console.error('Error stopping recording:', error);
      alert('Failed to stop recording');
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
                
                {/* Recording Controls */}
                {user && session.organizer_id === user.id && session.status === 'live' && (
                  <>
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600"
                        title="Start Recording"
                      >
                        <div className="w-5 h-5 bg-white rounded-full"></div>
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="p-3 rounded-full bg-gray-500 text-white hover:bg-gray-600"
                        title="Stop Recording"
                      >
                        <div className="w-5 h-5 bg-white rounded-full"></div>
                      </button>
                    )}
                  </>
                )}
                
                <button className="p-3 rounded-full bg-gray-200 text-gray-700">
                  <Settings className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-full bg-gray-200 text-gray-700">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Session Management Buttons */}
              <div className="mt-6 text-center space-x-4">
                {!isParticipating && session.status === 'upcoming' && (
                  <button
                    onClick={joinSession}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Join Session
                  </button>
                )}
                
                {/* Organizer Controls */}
                {user && session.organizer_id === user.id && (
                  <>
                    {session.status === 'upcoming' && (
                      <button
                        onClick={startSession}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Start Session
                      </button>
                    )}
                    
                    {session.status === 'live' && (
                      <button
                        onClick={endSession}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        End Session
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <Brain className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Insights
                  {loadingInsights && (
                    <span className="ml-2 text-sm text-gray-500">(Analyzing...)</span>
                  )}
                </h3>
              </div>
              <div className="space-y-3">
                {aiInsights.length > 0 ? (
                  aiInsights.map((insight, index) => (
                    <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${
                        insight.type === 'engagement' ? 'bg-green-500' :
                        insight.type === 'participation' ? 'bg-blue-500' :
                        insight.type === 'content' ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{insight.message}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <span className="capitalize">{insight.type}</span>
                          <span className="mx-1">•</span>
                          <span>{Math.round(insight.confidence * 100)}% confidence</span>
                          <span className="mx-1">•</span>
                          <span>{new Date(insight.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {loadingInsights ? 'Generating AI insights...' : 'No insights available yet'}
                    </p>
                  </div>
                )}
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
              
              {/* Question Input */}
              {isParticipating && session.status === 'live' && (
                <div className="mb-4">
                  <form onSubmit={handleQuestionSubmit} className="flex space-x-2">
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Ask a question..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!newQuestion.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ask
                    </button>
                  </form>
                </div>
              )}
              
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

            {/* Session Analytics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Session Analytics</h3>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Questions:</span>
                  <span className="text-sm font-medium">{sessionAnalytics.totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Engagement:</span>
                  <span className="text-sm font-medium">{Math.round(sessionAnalytics.avgEngagement)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Participation Rate:</span>
                  <span className="text-sm font-medium">{Math.round(sessionAnalytics.participationRate)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="text-sm font-medium">{sessionAnalytics.sessionDuration} min</span>
                </div>
              </div>
              
              {/* Report Generation */}
              {session.status === 'completed' && (
                <button
                  onClick={generateSessionReport}
                  className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  Generate Report
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionView;