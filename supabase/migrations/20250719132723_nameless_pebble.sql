/*
  # Create user preferences table

  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `google_api_enabled` (boolean, default false)
      - `groq_api_enabled` (boolean, default false)
      - `google_api_key` (text, encrypted)
      - `groq_api_key` (text, encrypted)
      - `notification_email` (boolean, default true)
      - `notification_push` (boolean, default true)
      - `notification_session_reminders` (boolean, default true)
      - `notification_engagement_updates` (boolean, default false)
      - `notification_weekly_report` (boolean, default true)
      - `privacy_profile_visible` (boolean, default true)
      - `privacy_engagement_visible` (boolean, default true)
      - `privacy_badges_visible` (boolean, default true)
      - `privacy_leaderboard_visible` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_preferences` table
    - Add policies for authenticated users to manage their own preferences
*/

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  google_api_enabled boolean DEFAULT false,
  groq_api_enabled boolean DEFAULT false,
  google_api_key text,
  groq_api_key text,
  notification_email boolean DEFAULT true,
  notification_push boolean DEFAULT true,
  notification_session_reminders boolean DEFAULT true,
  notification_engagement_updates boolean DEFAULT false,
  notification_weekly_report boolean DEFAULT true,
  privacy_profile_visible boolean DEFAULT true,
  privacy_engagement_visible boolean DEFAULT true,
  privacy_badges_visible boolean DEFAULT true,
  privacy_leaderboard_visible boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();