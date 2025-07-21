import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  name: string;
  organization?: string;
  avatar_url?: string;
  role: 'student' | 'admin' | 'moderator';
  engagement_score: number;
  total_events: number;
  badges: string[];
  joined_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  google_api_enabled: boolean;
  groq_api_enabled: boolean;
  google_api_key?: string;
  groq_api_key?: string;
  notification_email: boolean;
  notification_push: boolean;
  notification_session_reminders: boolean;
  notification_engagement_updates: boolean;
  notification_weekly_report: boolean;
  privacy_profile_visible: boolean;
  privacy_engagement_visible: boolean;
  privacy_badges_visible: boolean;
  privacy_leaderboard_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  message_content: string;
  sender_name: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  created_at: string;
}