-- =====================================================
-- Fix Text Models with Incorrect Image Capability
-- =====================================================
-- Problem: Some text models may have capabilities.image = true
-- when they should have capabilities.image = false
-- This causes them to appear in the image generation model selector
-- =====================================================
-- Date: 2025-01-31
-- Reason: After adding 68 NeuroAPI text models, need to ensure
-- all text-only models have correct capabilities
-- =====================================================

-- =====================================================
-- Step 1: Verify current state (for debugging)
-- =====================================================
-- Uncomment to see which models have wrong capabilities:
-- SELECT provider_type, model_id, model_name, capabilities
-- FROM ai_models
-- WHERE capabilities->>'text' = 'true'
--   AND capabilities->>'image' = 'true'
-- ORDER BY provider_type, model_id;

-- =====================================================
-- Step 2: Fix ALL text models across all providers
-- =====================================================
-- This ensures that ANY text model that incorrectly has
-- capabilities.image = true will be fixed to false

UPDATE ai_models
SET capabilities = jsonb_set(capabilities, '{image}', 'false'::jsonb)
WHERE capabilities->>'text' = 'true'
  AND capabilities->>'image' = 'true';

-- =====================================================
-- Step 3: Verify the fix worked
-- =====================================================
-- This should return 0 rows if the fix worked:
-- SELECT provider_type, model_id, model_name, capabilities
-- FROM ai_models
-- WHERE capabilities->>'text' = 'true'
--   AND capabilities->>'image' = 'true';

-- =====================================================
-- Step 4: Verify image models are still correct
-- =====================================================
-- This should return only image generation models:
-- SELECT provider_type, model_id, model_name, capabilities, pricing
-- FROM ai_models
-- WHERE capabilities->>'image' = 'true'
-- ORDER BY provider_type, pricing->>'output';

COMMENT ON TABLE ai_models IS 'AI Models catalog with capabilities. capabilities.image = true means IMAGE GENERATION (DALL-E, Imagen), NOT image analysis (multimodal). All GPT/Claude/Gemini text models can analyze images but should have capabilities.image = false';
