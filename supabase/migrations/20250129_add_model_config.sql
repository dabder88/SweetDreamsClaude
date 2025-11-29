-- =====================================================
-- Add model-specific configuration support
-- =====================================================
-- Allows admins to configure temperature and max_tokens
-- for each AI model individually
-- =====================================================

-- Add model_config column to ai_models table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_models'
    AND column_name = 'model_config'
  ) THEN
    ALTER TABLE ai_models
    ADD COLUMN model_config JSONB DEFAULT '{"temperature": 0.4, "max_tokens": 8192}'::jsonb;

    COMMENT ON COLUMN ai_models.model_config IS 'Model-specific configuration: temperature, max_tokens, top_p, etc.';
  END IF;
END $$;

-- Update existing models with default config if they don't have one
UPDATE ai_models
SET model_config = '{"temperature": 0.4, "max_tokens": 8192, "top_p": 1.0}'::jsonb
WHERE model_config IS NULL;

-- =====================================================
-- Migration Complete!
-- =====================================================
-- Now each model can have its own temperature and max_tokens settings
-- Admins can configure these through the AI Providers UI
-- =====================================================
