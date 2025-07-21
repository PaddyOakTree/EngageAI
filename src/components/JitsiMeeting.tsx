import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { supabase } from '../lib/supabase';

// Declare JitsiMeetExternalAPI as a global variable
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface JitsiMeetingProps {
  roomName: string;
  displayName: string;
  sessionId: string;
  userId: string;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  onChatMessageReceived?: (message: any) => void;
  onMeetingEnded?: () => void;
  onMeetingStarted?: () => void;
}

export interface JitsiMeetingRef {
  toggleAudio: () => void;
  toggleVideo: () => void;
  hangUp: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}

const JitsiMeeting = forwardRef<JitsiMeetingRef, JitsiMeetingProps>(({
  roomName,
  displayName,
  sessionId,
  userId,
  onParticipantJoined,
  onParticipantLeft,
  onChatMessageReceived,
  onMeetingEnded,
  onMeetingStarted
}, ref) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    toggleAudio: () => {
      if (api) {
        api.executeCommand('toggleAudio');
        setIsAudioMuted(!isAudioMuted);
      }
    },
    toggleVideo: () => {
      if (api) {
        api.executeCommand('toggleVideo');
        setIsVideoMuted(!isVideoMuted);
      }
    },
    hangUp: () => {
      if (api) {
        api.executeCommand('hangup');
      }
    },
    startRecording: () => {
      if (api) {
        api.executeCommand('startRecording', {
          mode: 'stream'
        });
        setIsRecording(true);
      }
    },
    stopRecording: () => {
      if (api) {
        api.executeCommand('stopRecording', 'stream');
        setIsRecording(false);
      }
    }
  }));

  // Network check function
  const checkNetworkConnectivity = async () => {
    try {
      console.log('[Jitsi] Checking network connectivity...');
      
      // Test JaaS (8x8.vc) domain connectivity
      await fetch('https://8x8.vc/vpaas-magic-cookie-0bbaed97bee948e59c0ee2d99954fc7c/external_api.js', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      console.log('[JaaS] 8x8.vc server reachable');
      return true;
    } catch (error) {
      console.error('[JaaS] Network connectivity check failed:', error);
      setError('Network connectivity issue detected. Unable to reach 8x8.vc. Please check your internet connection.');
      return false;
    }
  };

  useEffect(() => {
    const loadJitsiScript = async () => {
      // First check network connectivity
      const isOnline = await checkNetworkConnectivity();
      if (!isOnline) return Promise.reject(new Error('Network connectivity check failed'));

      return new Promise<void>((resolve, reject) => {
        console.log('[Jitsi] Loading Jitsi Meet API...');
        
        // Check if Jitsi script is already loaded
        if (window.JitsiMeetExternalAPI) {
          console.log('[Jitsi] Jitsi API already loaded');
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://8x8.vc/vpaas-magic-cookie-0bbaed97bee948e59c0ee2d99954fc7c/external_api.js';
        script.async = true;
        
        script.onload = () => {
          console.log('[Jitsi] Jitsi Meet API loaded successfully');
          resolve();
        };
        
        script.onerror = (error) => {
          console.error('[Jitsi] Failed to load Jitsi Meet API:', error);
          reject(new Error('Failed to load Jitsi Meet API. Please check your network connection or try again later.'));
        };
        
        // Set timeout for script loading
        const timeoutId = setTimeout(() => {
          console.error('[Jitsi] Jitsi Meet API loading timeout');
          document.head.removeChild(script);
          reject(new Error('Jitsi Meet API loading timeout. Please check your network connection.'));
        }, 10000); // 10 seconds timeout
        
        script.onload = () => {
          clearTimeout(timeoutId);
          console.log('[Jitsi] Jitsi Meet API loaded successfully');
          resolve();
        };
        
        console.log('[Jitsi] Appending Jitsi script to document head');
        document.head.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await loadJitsiScript();

        if (!jitsiContainerRef.current) {
          throw new Error('Jitsi container not found');
        }

        // Clear any existing content
        jitsiContainerRef.current.innerHTML = '';

        const domain = '8x8.vc';
        const options = {
          roomName: `vpaas-magic-cookie-0bbaed97bee948e59c0ee2d99954fc7c/${roomName}`,
          // If you want to use JWT authentication, uncomment the following line
          // jwt: 'your-generated-jwt-token',
          
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: displayName
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            enableClosePage: false,
            prejoinPageEnabled: false,
            disableInviteFunctions: true,
            doNotStoreRoom: true,
            disableDeepLinking: true
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
            ],
            SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            SHOW_POWERED_BY: false,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            SHOW_CHROME_EXTENSION_BANNER: false
          }
        };

        const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
        setApi(jitsiApi);

        // Set up event listeners
        jitsiApi.addEventListener('participantJoined', async (participant: any) => {
          console.log('Participant joined:', participant);
          
          // Update session_participants table
          try {
            await supabase
              .from('session_participants')
              .upsert({
                session_id: sessionId,
                user_id: userId,
                joined_at: new Date().toISOString(),
                is_muted: false
              }, {
                onConflict: 'session_id,user_id'
              });
          } catch (error) {
            console.error('Error updating participant data:', error);
          }

          onParticipantJoined?.(participant);
        });

        jitsiApi.addEventListener('participantLeft', async (participant: any) => {
          console.log('Participant left:', participant);
          
          // Update session_participants table
          try {
            await supabase
              .from('session_participants')
              .update({
                left_at: new Date().toISOString()
              })
              .eq('session_id', sessionId)
              .eq('user_id', userId);
          } catch (error) {
            console.error('Error updating participant leave data:', error);
          }

          onParticipantLeft?.(participant);
        });

        jitsiApi.addEventListener('incomingMessage', async (message: any) => {
          console.log('Chat message received:', message);
          
          // Store chat message in database
          try {
            await supabase
              .from('session_chat_messages')
              .insert({
                session_id: sessionId,
                user_id: userId,
                message_content: message.message,
                sender_name: message.from || displayName,
                created_at: new Date().toISOString()
              });
          } catch (error) {
            console.error('Error storing chat message:', error);
          }

          onChatMessageReceived?.(message);
        });

        jitsiApi.addEventListener('videoConferenceJoined', async () => {
          console.log('Video conference joined');
          setIsLoading(false);
          
          // Update session status and participant engagement
          try {
            await supabase
              .from('session_participants')
              .upsert({
                session_id: sessionId,
                user_id: userId,
                joined_at: new Date().toISOString(),
                engagement_score: 10 // Initial engagement score for joining
              }, {
                onConflict: 'session_id,user_id'
              });

            // Track engagement event
            await supabase
              .from('engagement_analytics')
              .upsert({
                session_id: sessionId,
                user_id: userId,
                engagement_score: 10,
                participation_type: 'session_join',
                duration_minutes: 0,
                metadata: {
                  platform: 'jitsi',
                  timestamp: new Date().toISOString()
                }
              }, {
                onConflict: 'session_id,user_id'
              });
          } catch (error) {
            console.error('Error updating engagement data:', error);
          }

          onMeetingStarted?.();
        });

        jitsiApi.addEventListener('videoConferenceLeft', async () => {
          console.log('Video conference left');
          
          // Calculate session duration and update engagement
          try {
            const { data: participant } = await supabase
              .from('session_participants')
              .select('joined_at')
              .eq('session_id', sessionId)
              .eq('user_id', userId)
              .single();

            if (participant?.joined_at) {
              const joinTime = new Date(participant.joined_at);
              const leaveTime = new Date();
              const durationMinutes = Math.round((leaveTime.getTime() - joinTime.getTime()) / (1000 * 60));

              await supabase
                .from('session_participants')
                .update({
                  left_at: leaveTime.toISOString(),
                  time_spent: durationMinutes,
                  engagement_score: Math.min(100, 10 + (durationMinutes * 2)) // Base score + time bonus
                })
                .eq('session_id', sessionId)
                .eq('user_id', userId);

              // Update engagement analytics
              await supabase
                .from('engagement_analytics')
                .update({
                  duration_minutes: durationMinutes,
                  engagement_score: Math.min(100, 10 + (durationMinutes * 2)),
                  participation_type: 'session_leave'
                })
                .eq('session_id', sessionId)
                .eq('user_id', userId);
            }
          } catch (error) {
            console.error('Error updating leave data:', error);
          }

          onMeetingEnded?.();
        });

        jitsiApi.addEventListener('audioMuteStatusChanged', (event: any) => {
          setIsAudioMuted(event.muted);
        });

        jitsiApi.addEventListener('videoMuteStatusChanged', (event: any) => {
          setIsVideoMuted(event.muted);
        });

        jitsiApi.addEventListener('recordingStatusChanged', (event: any) => {
          setIsRecording(event.on);
          
          // Update recording status in database
          if (event.on) {
            supabase
              .from('session_recordings')
              .upsert({
                session_id: sessionId,
                status: 'recording',
                started_at: new Date().toISOString()
              }, {
                onConflict: 'session_id'
              });
          } else {
            supabase
              .from('session_recordings')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString()
              })
              .eq('session_id', sessionId);
          }
        });

      } catch (err) {
        console.error('Error initializing 8x8 Video Conference:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize 8x8 Video Conference');
        setIsLoading(false);
      }
    };

    initializeJitsi();

    // Cleanup function
    return () => {
      if (api) {
        api.dispose();
      }
    };
  }, [roomName, displayName, sessionId, userId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-50 p-6 rounded-lg space-y-4">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-red-800">Meeting Connection Error</h2>
        <p className="text-red-600 text-center">{error}</p>
        
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-medium text-yellow-800 mb-2">Troubleshooting Steps:</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
            <li>Ensure meet.jit.si is not blocked by your network</li>
            <li>Try using a different browser</li>
          </ol>
        </div>
        
        <div className="flex space-x-4 mt-6">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.open('https://meet.jit.si', '_blank')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test Jitsi Directly
          </button>
        </div>
        
        <div className="mt-6 text-xs text-gray-500">
          <p>If the problem persists, please contact support with the following details:</p>
          <p className="mt-1 font-mono bg-gray-100 p-2 rounded">
            Session: {sessionId} | User: {userId || 'Not authenticated'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6 rounded-lg space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 bg-indigo-100 rounded-full"></div>
          </div>
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-medium text-gray-800">Setting up your meeting room</h3>
          <p className="text-sm text-gray-600">This may take a moment...</p>
          <div className="pt-4">
            <div className="h-1 w-32 bg-gray-200 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-indigo-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500 space-y-1 text-center">
          <p>Checking network connection...</p>
          <p>Loading Jitsi Meet API...</p>
          <p>Initializing video session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={jitsiContainerRef} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Status indicators */}
      <div className="absolute top-4 right-4 flex space-x-2">
        {isRecording && (
          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
            REC
          </div>
        )}
        <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
          {isAudioMuted ? '🔇' : '🔊'} {isVideoMuted ? '📹' : '📷'}
        </div>
      </div>
    </div>
  );
});

JitsiMeeting.displayName = 'JitsiMeeting';

export default JitsiMeeting;