import { supabase } from './supabase';

export interface RecordingSession {
  id: string;
  sessionId: string;
  recordingUrl: string | null;
  durationMinutes: number;
  fileSizeMb: number;
  status: 'pending' | 'recording' | 'completed' | 'failed';
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

class RecordingService {
  private recordingSessions: Map<string, RecordingSession> = new Map();

  // Start a recording session
  async startRecording(sessionId: string): Promise<RecordingSession> {
    try {
      // Create recording session in database
      const { data: recording, error } = await supabase
        .from('session_recordings')
        .insert({
          session_id: sessionId,
          status: 'recording',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // In a real implementation, this would integrate with a recording service
      // For now, we'll simulate the recording process
      const recordingSession: RecordingSession = {
        id: recording.id,
        sessionId: recording.session_id,
        recordingUrl: null,
        durationMinutes: 0,
        fileSizeMb: 0,
        status: 'recording',
        startedAt: recording.started_at,
        completedAt: null,
        createdAt: recording.created_at
      };

      this.recordingSessions.set(sessionId, recordingSession);

      // Simulate recording process
      setTimeout(() => {
        this.updateRecordingProgress(sessionId);
      }, 5000);

      return recordingSession;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  // Stop a recording session
  async stopRecording(sessionId: string): Promise<RecordingSession> {
    try {
      const recordingSession = this.recordingSessions.get(sessionId);
      if (!recordingSession) {
        throw new Error('No active recording session found');
      }

      // Generate a mock recording URL
      const recordingUrl = `https://engageai-recordings.s3.amazonaws.com/session-${sessionId}-${Date.now()}.mp4`;
      const durationMinutes = Math.floor((Date.now() - new Date(recordingSession.startedAt!).getTime()) / (1000 * 60));
      const fileSizeMb = Math.random() * 50 + 10; // Random file size between 10-60MB

      // Update recording session in database
      const { data: updatedRecording, error } = await supabase
        .from('session_recordings')
        .update({
          status: 'completed',
          recording_url: recordingUrl,
          duration_minutes: durationMinutes,
          file_size_mb: fileSizeMb,
          completed_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;

      const completedSession: RecordingSession = {
        id: updatedRecording.id,
        sessionId: updatedRecording.session_id,
        recordingUrl: updatedRecording.recording_url,
        durationMinutes: updatedRecording.duration_minutes,
        fileSizeMb: updatedRecording.file_size_mb,
        status: 'completed',
        startedAt: updatedRecording.started_at,
        completedAt: updatedRecording.completed_at,
        createdAt: updatedRecording.created_at
      };

      this.recordingSessions.set(sessionId, completedSession);
      return completedSession;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  // Get recording session for a session
  async getRecordingSession(sessionId: string): Promise<RecordingSession | null> {
    try {
      const { data: recording, error } = await supabase
        .from('session_recordings')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

      if (!recording) return null;

      return {
        id: recording.id,
        sessionId: recording.session_id,
        recordingUrl: recording.recording_url,
        durationMinutes: recording.duration_minutes,
        fileSizeMb: recording.file_size_mb,
        status: recording.status,
        startedAt: recording.started_at,
        completedAt: recording.completed_at,
        createdAt: recording.created_at
      };
    } catch (error) {
      console.error('Error getting recording session:', error);
      return null;
    }
  }

  // Get all recordings for a session
  async getSessionRecordings(sessionId: string): Promise<RecordingSession[]> {
    try {
      const { data: recordings, error } = await supabase
        .from('session_recordings')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (recordings || []).map(recording => ({
        id: recording.id,
        sessionId: recording.session_id,
        recordingUrl: recording.recording_url,
        durationMinutes: recording.duration_minutes,
        fileSizeMb: recording.file_size_mb,
        status: recording.status,
        startedAt: recording.started_at,
        completedAt: recording.completed_at,
        createdAt: recording.created_at
      }));
    } catch (error) {
      console.error('Error getting session recordings:', error);
      return [];
    }
  }

  // Delete a recording
  async deleteRecording(recordingId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('session_recordings')
        .delete()
        .eq('id', recordingId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }

  // Update recording progress (simulated)
  private async updateRecordingProgress(sessionId: string): Promise<void> {
    const recordingSession = this.recordingSessions.get(sessionId);
    if (!recordingSession || recordingSession.status !== 'recording') return;

    // Update duration
    const durationMinutes = Math.floor((Date.now() - new Date(recordingSession.startedAt!).getTime()) / (1000 * 60));
    
    try {
      await supabase
        .from('session_recordings')
        .update({
          duration_minutes: durationMinutes
        })
        .eq('session_id', sessionId);

      recordingSession.durationMinutes = durationMinutes;
      this.recordingSessions.set(sessionId, recordingSession);
    } catch (error) {
      console.error('Error updating recording progress:', error);
    }
  }

  // Get recording statistics
  async getRecordingStats(): Promise<{
    totalRecordings: number;
    totalDuration: number;
    totalFileSize: number;
    averageDuration: number;
  }> {
    try {
      const { data: recordings, error } = await supabase
        .from('session_recordings')
        .select('duration_minutes, file_size_mb')
        .eq('status', 'completed');

      if (error) throw error;

      const totalRecordings = recordings?.length || 0;
      const totalDuration = recordings?.reduce((sum, r) => sum + (r.duration_minutes || 0), 0) || 0;
      const totalFileSize = recordings?.reduce((sum, r) => sum + (r.file_size_mb || 0), 0) || 0;
      const averageDuration = totalRecordings > 0 ? totalDuration / totalRecordings : 0;

      return {
        totalRecordings,
        totalDuration,
        totalFileSize,
        averageDuration
      };
    } catch (error) {
      console.error('Error getting recording stats:', error);
      return {
        totalRecordings: 0,
        totalDuration: 0,
        totalFileSize: 0,
        averageDuration: 0
      };
    }
  }
}

const recordingService = new RecordingService();

export default recordingService; 