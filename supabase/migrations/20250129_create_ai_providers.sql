-- =====================================================
-- AI Provider Management System - Database Schema
-- =====================================================
-- This migration creates tables for managing multiple AI providers
-- (OpenAI, Claude, AiTunnel, NeuroAPI, etc.) with flexible configuration
-- =====================================================

-- =====================================================
-- 1. AI Provider Configurations Table
-- =====================================================
-- Stores configuration for each AI provider (API keys, base URLs, etc.)
-- Only one provider can be active at a time
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('gemini', 'openai', 'claude', 'aitunnel', 'neuroapi', 'custom')),
  provider_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  api_key_env_name TEXT, -- Name of environment variable storing API key (e.g., 'VITE_AITUNNEL_KEY')
  base_url TEXT, -- Base URL for API calls (e.g., 'https://api.aitunnel.ru/v1/')
  default_model_id UUID, -- Reference to ai_models table
  config JSONB DEFAULT '{}', -- Additional config: {temperature, max_tokens, top_p, etc}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_type)
);

-- Add missing columns if table already existed
DO $$
BEGIN
  -- Add provider_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_provider_configs' AND column_name = 'provider_name'
  ) THEN
    ALTER TABLE ai_provider_configs ADD COLUMN provider_name TEXT NOT NULL DEFAULT 'Unknown Provider';
  END IF;

  -- Add api_key_env_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_provider_configs' AND column_name = 'api_key_env_name'
  ) THEN
    ALTER TABLE ai_provider_configs ADD COLUMN api_key_env_name TEXT;
  END IF;

  -- Add base_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_provider_configs' AND column_name = 'base_url'
  ) THEN
    ALTER TABLE ai_provider_configs ADD COLUMN base_url TEXT;
  END IF;

  -- Add default_model_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_provider_configs' AND column_name = 'default_model_id'
  ) THEN
    ALTER TABLE ai_provider_configs ADD COLUMN default_model_id UUID;
  END IF;

  -- Add config if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_provider_configs' AND column_name = 'config'
  ) THEN
    ALTER TABLE ai_provider_configs ADD COLUMN config JSONB DEFAULT '{}';
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_provider_configs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE ai_provider_configs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Remove old columns that are not in new schema
DO $$
BEGIN
  -- Drop config_name if it exists (old column, not used anymore)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_provider_configs' AND column_name = 'config_name'
  ) THEN
    ALTER TABLE ai_provider_configs DROP COLUMN config_name;
  END IF;

  -- Drop model_name if it exists in ai_provider_configs (moved to ai_models)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_provider_configs' AND column_name = 'model_name'
  ) THEN
    ALTER TABLE ai_provider_configs DROP COLUMN model_name;
  END IF;

  -- Drop parameters if it exists (replaced by config JSONB)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_provider_configs' AND column_name = 'parameters'
  ) THEN
    ALTER TABLE ai_provider_configs DROP COLUMN parameters;
  END IF;

  -- Drop api_key_encrypted if it exists (we use env vars instead)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_provider_configs' AND column_name = 'api_key_encrypted'
  ) THEN
    ALTER TABLE ai_provider_configs DROP COLUMN api_key_encrypted;
  END IF;
END $$;

-- Add UNIQUE constraint on provider_type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_provider_configs_provider_type_key'
    AND conrelid = 'ai_provider_configs'::regclass
  ) THEN
    ALTER TABLE ai_provider_configs ADD CONSTRAINT ai_provider_configs_provider_type_key UNIQUE (provider_type);
  END IF;
END $$;

-- =====================================================
-- 2. AI Models Table
-- =====================================================
-- Stores available models for each provider with pricing and capabilities
-- Allows flexible model selection without code changes
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_type TEXT NOT NULL,
  model_id TEXT NOT NULL, -- Model identifier used in API calls (e.g., 'gpt-5-mini', 'claude-sonnet-4-5')
  model_name TEXT NOT NULL, -- Human-readable name (e.g., 'GPT-5 Mini', 'Claude Sonnet 4.5')
  provider_name TEXT, -- Provider display name (e.g., 'OpenAI', 'Anthropic', 'Google')
  capabilities JSONB DEFAULT '{"text": true, "image": false, "reasoning": false}', -- Model capabilities
  pricing JSONB DEFAULT '{"input": 0, "output": 0, "currency": "USD", "per": "1M tokens"}', -- Pricing info
  performance JSONB DEFAULT '{"intelligence": "medium", "speed": "medium"}', -- Performance metrics
  context_length INTEGER DEFAULT 128000, -- Maximum context window in tokens
  is_available BOOLEAN DEFAULT true, -- Whether model is currently available
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_type, model_id)
);

-- Add missing columns if table already existed
DO $$
BEGIN
  -- Add provider_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_models' AND column_name = 'provider_name'
  ) THEN
    ALTER TABLE ai_models ADD COLUMN provider_name TEXT;
  END IF;

  -- Add capabilities if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_models' AND column_name = 'capabilities'
  ) THEN
    ALTER TABLE ai_models ADD COLUMN capabilities JSONB DEFAULT '{"text": true, "image": false, "reasoning": false}';
  END IF;

  -- Add pricing if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_models' AND column_name = 'pricing'
  ) THEN
    ALTER TABLE ai_models ADD COLUMN pricing JSONB DEFAULT '{"input": 0, "output": 0, "currency": "USD", "per": "1M tokens"}';
  END IF;

  -- Add performance if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_models' AND column_name = 'performance'
  ) THEN
    ALTER TABLE ai_models ADD COLUMN performance JSONB DEFAULT '{"intelligence": "medium", "speed": "medium"}';
  END IF;

  -- Add context_length if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_models' AND column_name = 'context_length'
  ) THEN
    ALTER TABLE ai_models ADD COLUMN context_length INTEGER DEFAULT 128000;
  END IF;

  -- Add is_available if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_models' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE ai_models ADD COLUMN is_available BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add UNIQUE constraint on (provider_type, model_id) if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_models_provider_type_model_id_key'
    AND conrelid = 'ai_models'::regclass
  ) THEN
    ALTER TABLE ai_models ADD CONSTRAINT ai_models_provider_type_model_id_key UNIQUE (provider_type, model_id);
  END IF;
END $$;

-- =====================================================
-- 3. Enable Row Level Security (RLS)
-- =====================================================
-- Only admins can manage AI provider configurations
-- =====================================================

ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS Policies for Admin Access
-- =====================================================
-- These policies assume an admin_users table exists
-- If not, they will fail gracefully and can be created later
-- Drop existing policies first to make migration idempotent
-- =====================================================

-- Drop existing policies for ai_provider_configs
DROP POLICY IF EXISTS "Admins can manage provider configs" ON ai_provider_configs;
DROP POLICY IF EXISTS "Authenticated users can manage provider configs" ON ai_provider_configs;

-- Drop existing policies for ai_models
DROP POLICY IF EXISTS "Admins can manage models" ON ai_models;
DROP POLICY IF EXISTS "Authenticated users can manage models" ON ai_models;

-- Policy for ai_provider_configs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    CREATE POLICY "Admins can manage provider configs"
      ON ai_provider_configs FOR ALL
      USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
  ELSE
    -- Fallback: allow authenticated users (temporary until admin_users exists)
    CREATE POLICY "Authenticated users can manage provider configs"
      ON ai_provider_configs FOR ALL
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Policy for ai_models
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    CREATE POLICY "Admins can manage models"
      ON ai_models FOR ALL
      USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
  ELSE
    -- Fallback: allow authenticated users (temporary until admin_users exists)
    CREATE POLICY "Authenticated users can manage models"
      ON ai_models FOR ALL
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- =====================================================
-- 5. Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ai_provider_configs_active
  ON ai_provider_configs(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ai_models_provider_type
  ON ai_models(provider_type);

CREATE INDEX IF NOT EXISTS idx_ai_models_available
  ON ai_models(is_available) WHERE is_available = true;

-- =====================================================
-- 6. Foreign Key Constraint
-- =====================================================
-- Drop existing constraint first, then recreate
-- =====================================================

-- Drop constraint if exists
ALTER TABLE ai_provider_configs
  DROP CONSTRAINT IF EXISTS fk_default_model;

-- Add constraint (only if both tables exist)
DO $$
BEGIN
  -- Check if both tables and column exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_provider_configs'
    AND column_name = 'default_model_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'ai_models'
  ) THEN
    ALTER TABLE ai_provider_configs
      ADD CONSTRAINT fk_default_model
      FOREIGN KEY (default_model_id)
      REFERENCES ai_models(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- Migration Complete!
-- =====================================================
-- Next step: Run seed_ai_providers.sql to populate initial data
-- =====================================================
