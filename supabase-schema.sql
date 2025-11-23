-- ============================================
-- PsyDream Supabase Database Schema
-- ============================================
-- Run this SQL in Supabase SQL Editor to set up the database
-- for multi-user dream analysis application

-- Table for storing dream entries
CREATE TABLE dream_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  dream_data JSONB NOT NULL,
  analysis JSONB,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) to protect user data
ALTER TABLE dream_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own dream entries
CREATE POLICY "Users can view own dreams"
  ON dream_entries FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own dream entries
CREATE POLICY "Users can insert own dreams"
  ON dream_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own dream entries
CREATE POLICY "Users can update own dreams"
  ON dream_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own dream entries
CREATE POLICY "Users can delete own dreams"
  ON dream_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_dream_entries_user_id ON dream_entries(user_id);
CREATE INDEX idx_dream_entries_timestamp ON dream_entries(timestamp DESC);

-- ============================================
-- Schema is ready!
-- ============================================
-- Next steps:
-- 1. Configure environment variables in .env file
-- 2. Enable Email authentication in Supabase dashboard
-- 3. Start the app and test registration/login
