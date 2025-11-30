-- =====================================================
-- Diagnostic Script: Check Image Models Configuration
-- =====================================================
-- This script helps diagnose issues with image model display
-- in Admin Panel -> AI Providers -> "ИИ для изображений"
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- CHECK 1: Text models incorrectly marked as image models
-- =====================================================
SELECT
  '❌ PROBLEM: Text models with image=true' as check_name,
  COUNT(*) as count
FROM ai_models
WHERE capabilities->>'text' = 'true'
  AND capabilities->>'image' = 'true';

-- If count > 0, these models will incorrectly appear in image selector
SELECT
  provider_type,
  model_id,
  model_name,
  capabilities
FROM ai_models
WHERE capabilities->>'text' = 'true'
  AND capabilities->>'image' = 'true'
ORDER BY provider_type, model_id;

-- =====================================================
-- CHECK 2: Image generation models (should be 13+)
-- =====================================================
SELECT
  '✅ Image Generation Models Available' as check_name,
  COUNT(*) as count
FROM ai_models
WHERE capabilities->>'image' = 'true'
  AND is_available = true;

-- List all available image models
SELECT
  provider_type,
  model_id,
  model_name,
  pricing->>'output' as price_per_image,
  pricing->>'currency' as currency,
  performance->>'intelligence' as quality
FROM ai_models
WHERE capabilities->>'image' = 'true'
  AND is_available = true
ORDER BY
  provider_type,
  CASE
    WHEN pricing->>'currency' = 'RUB' THEN CAST(pricing->>'output' AS NUMERIC)
    WHEN pricing->>'currency' = 'USD' THEN CAST(pricing->>'output' AS NUMERIC) * 100
    ELSE 999999
  END;

-- =====================================================
-- CHECK 3: Provider configurations
-- =====================================================
SELECT
  '📊 Active Providers' as check_name;

SELECT
  provider_name,
  provider_type,
  is_active_for_text,
  is_active_for_images,
  (SELECT model_id FROM ai_models WHERE id = default_model_id_for_text) as default_text_model,
  (SELECT model_id FROM ai_models WHERE id = default_model_id_for_images) as default_image_model
FROM ai_provider_configs
ORDER BY provider_type;

-- =====================================================
-- CHECK 4: Models per provider for image task
-- =====================================================
SELECT
  '🖼️ Image Models by Provider' as check_name;

SELECT
  provider_type,
  COUNT(*) as image_models_count,
  STRING_AGG(model_id, ', ' ORDER BY pricing->>'output') as available_models
FROM ai_models
WHERE capabilities->>'image' = 'true'
  AND is_available = true
GROUP BY provider_type
ORDER BY provider_type;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================
-- CHECK 1: count should be 0
-- CHECK 2: count should be 13+ (2 OpenAI + 7 AiTunnel + 3 NeuroAPI + 1 Google)
-- CHECK 3: should show all providers with their active status
-- CHECK 4: should show:
--   - openai: 2 models (dall-e-3, dall-e-3-hd)
--   - aitunnel: 7 models (dall-e-2, seedream, flux, qwen, etc)
--   - neuroapi: 3 models (gpt-image-1, gemini flash, gemini pro)
--   - gemini: 1+ models (gemini-2.0-flash-exp)
-- =====================================================
