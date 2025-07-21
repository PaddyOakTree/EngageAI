/*
  # Add session chat messages table

  1. New Tables
    - `session_chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to sessions)
      - `user_id` (uuid, foreign key to users)
      - `message_content` (text)
      - `sender_name` (text)
      - `sentiment` (text, default 'neutral')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `session_chat_messages` table
    - Add policies for users to read messages from sessions they participate in
    - Add policies for users to insert their own messages
    - Add policies for moderators and admins to manage messages

  3. Indexes
    - Add index on session_id for efficient querying
    - Add index on user_id for user-specific queries
    - Add index on created_at for chronological ordering
*/

-- Create session_chat_messages table
CREATE TABLE IF NOT EXISTS session_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message_content text NOT NULL,
  sender_name text NOT NULL,
  sentiment text DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE session_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_chat_messages_session_id ON session_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_chat_messages_user_id ON session_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_session_chat_messages_created_at ON session_chat_messages(created_at);

-- RLS Policies

-- Users can read chat messages from sessions they participate in
CREATE POLICY "Users can read chat messages from sessions they participate in"
  ON session_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM session_participants sp
      WHERE sp.session_id = session_chat_messages.session_id
      AND sp.user_id = auth.uid()
    )
  );

-- Users can insert their own chat messages
CREATE POLICY "Users can insert their own chat messages"
  ON session_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Moderators and admins can read all chat messages
CREATE POLICY "Moderators and admins can read all chat messages"
  ON session_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('moderator', 'admin')
    )
  );

-- Moderators and admins can delete inappropriate messages
CREATE POLICY "Moderators and admins can delete chat messages"
  ON session_chat_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('moderator', 'admin')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER session_chat_messages_updated_at
  BEFORE UPDATE ON session_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();