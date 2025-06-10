/*
  # Gmail Email Scheduler Database Schema

  1. New Tables
    - `scheduled_emails`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `to_email` (text)
      - `subject` (text)
      - `body` (text)
      - `scheduled_at` (timestamptz)
      - `sent_at` (timestamptz, nullable)
      - `gmail_access_token` (text)
      - `gmail_refresh_token` (text)
      - `error` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `scheduled_emails` table
    - Add policy for users to read/write their own scheduled emails
    - Add indexes for performance optimization

  3. Functions
    - Update trigger for `updated_at` timestamp
*/

-- Create scheduled_emails table
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  gmail_access_token text NOT NULL,
  gmail_refresh_token text NOT NULL,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own scheduled emails"
  ON scheduled_emails
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled emails"
  ON scheduled_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled emails"
  ON scheduled_emails
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled emails"
  ON scheduled_emails
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_id ON scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_at ON scheduled_emails(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_sent_at ON scheduled_emails(sent_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_emails_updated_at
  BEFORE UPDATE ON scheduled_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();