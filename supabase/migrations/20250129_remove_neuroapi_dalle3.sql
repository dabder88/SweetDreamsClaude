-- =====================================================
-- Remove DALL-E 3 from NeuroAPI
-- =====================================================
-- Reason: NeuroAPI does not actually support DALL-E 3
-- Only 3 image models are available:
-- - gpt-image-1
-- - gemini-2.5-flash-image
-- - gemini-3-pro-image-preview
-- =====================================================

DELETE FROM ai_models
WHERE provider_type = 'neuroapi' AND model_id = 'dall-e-3';
