-- =====================================================
-- Fix Image Capabilities for Text Models
-- =====================================================
-- Problem: Multimodal text models (can analyze images) were incorrectly
-- marked as image generation models (capabilities.image = true)
-- This caused them to appear in image model selection dropdowns
-- =====================================================

-- =====================================================
-- Fix AiTunnel Text Models
-- =====================================================

UPDATE ai_models
SET capabilities = '{"text": true, "image": false, "reasoning": false}'::jsonb
WHERE provider_type = 'aitunnel' AND model_id = 'gpt-5-mini';

UPDATE ai_models
SET capabilities = '{"text": true, "image": false, "reasoning": true}'::jsonb
WHERE provider_type = 'aitunnel' AND model_id = 'gpt-5';

UPDATE ai_models
SET capabilities = '{"text": true, "image": false, "reasoning": true}'::jsonb
WHERE provider_type = 'aitunnel' AND model_id = 'claude-sonnet-4.5';

UPDATE ai_models
SET capabilities = '{"text": true, "image": false, "reasoning": false}'::jsonb
WHERE provider_type = 'aitunnel' AND model_id = 'gemini-2.5-flash';

UPDATE ai_models
SET capabilities = '{"text": true, "image": false, "reasoning": false}'::jsonb
WHERE provider_type = 'aitunnel' AND model_id = 'gpt-4o-mini';

-- =====================================================
-- Fix NeuroAPI Text Models
-- =====================================================

UPDATE ai_models
SET capabilities = '{"text": true, "image": false, "reasoning": false}'::jsonb
WHERE provider_type = 'neuroapi' AND model_id = 'gpt-5-mini';

UPDATE ai_models
SET capabilities = '{"text": true, "image": false, "reasoning": true}'::jsonb
WHERE provider_type = 'neuroapi' AND model_id = 'gpt-5';

UPDATE ai_models
SET capabilities = '{"text": true, "image": false, "reasoning": true}'::jsonb
WHERE provider_type = 'neuroapi' AND model_id = 'claude-sonnet-4-5-20250929';

UPDATE ai_models
SET capabilities = '{"text": true, "image": false, "reasoning": false}'::jsonb
WHERE provider_type = 'neuroapi' AND model_id = 'gemini-2.5-flash';

UPDATE ai_models
SET capabilities = '{"text": true, "image": false, "reasoning": false}'::jsonb
WHERE provider_type = 'neuroapi' AND model_id = 'gpt-4o';

UPDATE ai_models
SET capabilities = '{"text": true, "image": false, "reasoning": true}'::jsonb
WHERE provider_type = 'neuroapi' AND model_id = 'claude-opus-4-20250514';

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the fix worked:
-- SELECT provider_type, model_id, model_name, capabilities
-- FROM ai_models
-- WHERE provider_type IN ('aitunnel', 'neuroapi')
-- ORDER BY provider_type, model_id;
