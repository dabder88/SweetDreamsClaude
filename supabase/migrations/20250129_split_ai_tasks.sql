-- =====================================================
-- Split AI Provider Configuration by Task Type
-- =====================================================
-- Adds support for separate AI providers for different tasks:
-- - 'text': Dream analysis, reports
-- - 'image': Dream visualization, avatar generation
-- =====================================================

-- =====================================================
-- STEP 1: Add new columns for task-specific configuration
-- =====================================================

-- Add columns for text and image tasks
ALTER TABLE ai_provider_configs
  ADD COLUMN IF NOT EXISTS is_active_for_text BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active_for_images BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_model_id_for_text UUID REFERENCES ai_models(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_model_id_for_images UUID REFERENCES ai_models(id) ON DELETE SET NULL;

COMMENT ON COLUMN ai_provider_configs.is_active_for_text IS 'Whether this provider is active for text generation tasks (dream analysis, reports)';
COMMENT ON COLUMN ai_provider_configs.is_active_for_images IS 'Whether this provider is active for image generation tasks (visualization, avatars)';
COMMENT ON COLUMN ai_provider_configs.default_model_id_for_text IS 'Default model for text generation tasks';
COMMENT ON COLUMN ai_provider_configs.default_model_id_for_images IS 'Default model for image generation tasks';

-- =====================================================
-- STEP 2: Migrate existing data
-- =====================================================

-- Migrate existing is_active to is_active_for_text
UPDATE ai_provider_configs
SET is_active_for_text = is_active
WHERE is_active IS NOT NULL;

-- Migrate existing default_model_id to default_model_id_for_text
UPDATE ai_provider_configs
SET default_model_id_for_text = default_model_id
WHERE default_model_id IS NOT NULL;

-- Set Gemini as default for images (if it has image-capable models)
UPDATE ai_provider_configs
SET is_active_for_images = true
WHERE provider_type = 'gemini';

-- =====================================================
-- STEP 3: Add constraint - only one active per task type
-- =====================================================

-- Create unique partial indexes to ensure only one provider is active per task
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_text_provider
  ON ai_provider_configs (is_active_for_text)
  WHERE is_active_for_text = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_image_provider
  ON ai_provider_configs (is_active_for_images)
  WHERE is_active_for_images = true;

COMMENT ON INDEX idx_one_active_text_provider IS 'Ensures only one provider is active for text tasks';
COMMENT ON INDEX idx_one_active_image_provider IS 'Ensures only one provider is active for image tasks';

-- =====================================================
-- STEP 4: (Optional) Drop old columns after verification
-- =====================================================

-- Uncomment these lines AFTER verifying the migration worked:
-- ALTER TABLE ai_provider_configs DROP COLUMN IF EXISTS is_active;
-- ALTER TABLE ai_provider_configs DROP COLUMN IF EXISTS default_model_id;

-- =====================================================
-- Migration Complete!
-- =====================================================
-- Now you can:
-- 1. Set different providers for text and image tasks
-- 2. Configure separate models for each task type
-- 3. Prevent conflicts between task configurations
-- =====================================================
