-- =====================================================
-- PsyDream Supabase Database Setup
-- =====================================================
-- This file contains all necessary SQL commands to set up
-- the Supabase database for cross-device statistics sync
-- =====================================================

-- =====================================================
-- 1. Analysis Metadata Table
-- =====================================================
-- Stores lightweight metadata for ALL dream analyses
-- (even those not saved to journal) for cross-device stats
-- =====================================================

CREATE TABLE IF NOT EXISTS analysis_metadata (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  method TEXT NOT NULL,
  emotion TEXT NOT NULL,
  recurring BOOLEAN NOT NULL DEFAULT FALSE,
  symbols TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE analysis_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own analysis metadata
CREATE POLICY "Users can view own analysis metadata"
  ON analysis_metadata FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis metadata"
  ON analysis_metadata FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis metadata"
  ON analysis_metadata FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis metadata"
  ON analysis_metadata FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_metadata_user_id
  ON analysis_metadata(user_id);

CREATE INDEX IF NOT EXISTS idx_analysis_metadata_timestamp
  ON analysis_metadata(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_metadata_method
  ON analysis_metadata(method);

-- =====================================================
-- 2. User Data Storage Bucket (for avatars)
-- =====================================================
-- Create bucket if it doesn't exist
-- (Run this in Supabase Dashboard → Storage → Create Bucket)
-- Name: user-data
-- Public: true
-- =====================================================

-- Note: Bucket creation is done via Dashboard or this INSERT
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-data', 'user-data', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for user-data bucket
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- Create new policies
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-data'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-data');

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-data'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-data'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- MIGRATION: Add dream_description and life_situation to analysis_metadata
-- =====================================================
-- Run this if you already have the analysis_metadata table
ALTER TABLE analysis_metadata
ADD COLUMN IF NOT EXISTS dream_description TEXT,
ADD COLUMN IF NOT EXISTS life_situation TEXT;

-- =====================================================
-- Setup Complete!
-- =====================================================
-- After running this script:
-- 1. Your analysis_metadata table is ready for cross-device stats
-- 2. User avatars can be uploaded to the user-data bucket
-- 3. All data is protected by Row Level Security
-- 4. Dream descriptions are stored in metadata for archetype analysis
-- =====================================================
