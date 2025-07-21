import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
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

  useEffect(() => {
    const loadJitsiScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if Jitsi script is already loaded
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
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

        const domain = 'meet.jit.si';
        const options = {
          roomName: roomName,
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

          onMeetingStarted?.(
          );
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
        console.error('Error initializing Jitsi:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize meeting');
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
      <div className="flex items-center justify-center h-full bg-red-50 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <p className="text-red-800 font-medium">Meeting Error</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meeting...</p>
          <p className="text-gray-500 text-sm">Connecting to Jitsi Meet</p>
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