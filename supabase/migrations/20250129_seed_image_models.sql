-- =====================================================
-- Seed Image Generation Models
-- =====================================================
-- Adds models capable of generating images from text prompts
-- =====================================================

-- =====================================================
-- STEP 0: Create unique index for composite key
-- =====================================================
-- This allows the same model_id to exist for different providers
-- (e.g., dall-e-3 for openai, aitunnel, neuroapi)

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_models_provider_model
  ON ai_models(provider_type, model_id);

COMMENT ON INDEX idx_ai_models_provider_model IS 'Ensures unique combination of provider_type + model_id';

-- =====================================================
-- OpenAI Image Models (via Direct API)
-- =====================================================

INSERT INTO ai_models (
  provider_type,
  model_id,
  model_name,
  provider_name,
  capabilities,
  pricing,
  performance,
  context_length,
  is_available,
  model_config
)
VALUES
  -- DALL-E 3 (Standard Quality)
  (
    'openai',
    'dall-e-3',
    'DALL-E 3',
    'OpenAI Direct',
    '{"text": false, "image": true, "reasoning": false}'::jsonb,
    '{"input": 0, "output": 40.00, "currency": "USD", "per_tokens": 0, "per_image": 1}'::jsonb,
    '{"speed": "medium", "intelligence": "high"}'::jsonb,
    0, -- No text context
    true,
    '{"quality": "standard", "size": "1024x1024", "style": "vivid"}'::jsonb
  ),

  -- DALL-E 3 HD (High Quality)
  (
    'openai',
    'dall-e-3-hd',
    'DALL-E 3 HD',
    'OpenAI Direct',
    '{"text": false, "image": true, "reasoning": false}'::jsonb,
    '{"input": 0, "output": 80.00, "currency": "USD", "per_tokens": 0, "per_image": 1}'::jsonb,
    '{"speed": "slow", "intelligence": "very high"}'::jsonb,
    0,
    true,
    '{"quality": "hd", "size": "1024x1024", "style": "vivid"}'::jsonb
  )

ON CONFLICT (provider_type, model_id) DO UPDATE SET
  capabilities = EXCLUDED.capabilities,
  pricing = EXCLUDED.pricing,
  model_config = EXCLUDED.model_config;

-- =====================================================
-- AiTunnel Image Models (via Russian intermediary)
-- =====================================================

INSERT INTO ai_models (
  provider_type,
  model_id,
  model_name,
  provider_name,
  capabilities,
  pricing,
  performance,
  context_length,
  is_available,
  model_config
)
VALUES
  -- DALL-E 3 via AiTunnel (Ruble pricing)
  (
    'aitunnel',
    'dall-e-3',
    'DALL-E 3',
    'AiTunnel',
    '{"text": false, "image": true, "reasoning": false}'::jsonb,
    '{"input": 0, "output": 320.00, "currency": "RUB", "per_tokens": 0, "per_image": 1}'::jsonb,
    '{"speed": "medium", "intelligence": "high"}'::jsonb,
    0,
    true,
    '{"quality": "standard", "size": "1024x1024", "style": "vivid"}'::jsonb
  ),

  -- GPT Image 1 via AiTunnel
  (
    'aitunnel',
    'gpt-image-1',
    'GPT Image 1',
    'AiTunnel',
    '{"text": false, "image": true, "reasoning": false}'::jsonb,
    '{"input": 0, "output": 320.00, "currency": "RUB", "per_tokens": 0, "per_image": 1}'::jsonb,
    '{"speed": "slow", "intelligence": "high"}'::jsonb,
    0,
    true,
    '{"quality": "high", "size": "1024x1024"}'::jsonb
  ),

  -- Qwen Image Edit via AiTunnel
  (
    'aitunnel',
    'qwen-image-edit',
    'Qwen Image Edit',
    'AiTunnel',
    '{"text": false, "image": true, "reasoning": false}'::jsonb,
    '{"input": 0, "output": 200.00, "currency": "RUB", "per_tokens": 0, "per_image": 1}'::jsonb,
    '{"speed": "medium", "intelligence": "medium"}'::jsonb,
    0,
    true,
    '{"quality": "standard", "size": "1024x1024"}'::jsonb
  ),

  -- Gemini 2.5 Flash Image via AiTunnel
  (
    'aitunnel',
    'gemini-2.5-flash-image',
    'Gemini 2.5 Flash Image',
    'AiTunnel',
    '{"text": false, "image": true, "reasoning": false}'::jsonb,
    '{"input": 54, "output": 450, "currency": "RUB", "per_tokens": 1000000, "per_image": 0}'::jsonb,
    '{"speed": "very fast", "intelligence": "high"}'::jsonb,
    0,
    true,
    '{"quality": "standard", "size": "1024x1024"}'::jsonb
  ),

  -- Gemini 3 Pro Image Preview via AiTunnel
  (
    'aitunnel',
    'gemini-3-pro-image-preview',
    'Gemini 3 Pro Image Preview',
    'AiTunnel',
    '{"text": false, "image": true, "reasoning": true}'::jsonb,
    '{"input": 360, "output": 2160, "currency": "RUB", "per_tokens": 1000000, "per_image": 0}'::jsonb,
    '{"speed": "fast", "intelligence": "very high"}'::jsonb,
    0,
    true,
    '{"quality": "high", "resolution": "4K"}'::jsonb
  )

ON CONFLICT (provider_type, model_id) DO UPDATE SET
  capabilities = EXCLUDED.capabilities,
  pricing = EXCLUDED.pricing,
  model_config = EXCLUDED.model_config;

-- =====================================================
-- NeuroAPI Image Models (via international intermediary)
-- =====================================================

INSERT INTO ai_models (
  provider_type,
  model_id,
  model_name,
  provider_name,
  capabilities,
  pricing,
  performance,
  context_length,
  is_available,
  model_config
)
VALUES
  -- DALL-E 3 via NeuroAPI
  (
    'neuroapi',
    'dall-e-3',
    'DALL-E 3',
    'NeuroAPI',
    '{"text": false, "image": true, "reasoning": false}'::jsonb,
    '{"input": 0, "output": 40.00, "currency": "USD", "per_tokens": 0, "per_image": 1}'::jsonb,
    '{"speed": "medium", "intelligence": "high"}'::jsonb,
    0,
    true,
    '{"quality": "standard", "size": "1024x1024", "style": "vivid"}'::jsonb
  ),

  -- GPT Image 1 via NeuroAPI (Premium quality)
  (
    'neuroapi',
    'gpt-image-1',
    'GPT Image 1',
    'NeuroAPI',
    '{"text": false, "image": true, "reasoning": false}'::jsonb,
    '{"input": 4.28, "output": 34.28, "currency": "USD", "per_tokens": 0, "per_image": 1}'::jsonb,
    '{"speed": "slow", "intelligence": "high"}'::jsonb,
    0,
    true,
    '{"quality": "high", "size": "1024x1024"}'::jsonb
  ),

  -- Gemini 2.5 Flash Image via NeuroAPI (Fast and cheap)
  (
    'neuroapi',
    'gemini-2.5-flash-image',
    'Gemini 2.5 Flash Image',
    'NeuroAPI',
    '{"text": false, "image": true, "reasoning": false}'::jsonb,
    '{"input": 0, "output": 0.15, "currency": "USD", "per_tokens": 0, "per_image": 1}'::jsonb,
    '{"speed": "very fast", "intelligence": "high"}'::jsonb,
    0,
    true,
    '{"quality": "standard", "size": "1024x1024"}'::jsonb
  ),

  -- Gemini 3 Pro Image Preview via NeuroAPI (Premium 4K)
  (
    'neuroapi',
    'gemini-3-pro-image-preview',
    'Gemini 3 Pro Image Preview',
    'NeuroAPI',
    '{"text": false, "image": true, "reasoning": true}'::jsonb,
    '{"input": 0, "output": 0.47, "currency": "USD", "per_tokens": 0, "per_image": 1}'::jsonb,
    '{"speed": "fast", "intelligence": "very high"}'::jsonb,
    0,
    true,
    '{"quality": "high", "resolution": "4K"}'::jsonb
  )

ON CONFLICT (provider_type, model_id) DO UPDATE SET
  capabilities = EXCLUDED.capabilities,
  pricing = EXCLUDED.pricing,
  model_config = EXCLUDED.model_config;

-- =====================================================
-- Google Gemini Image Models
-- =====================================================

INSERT INTO ai_models (
  provider_type,
  model_id,
  model_name,
  provider_name,
  capabilities,
  pricing,
  performance,
  context_length,
  is_available,
  model_config
)
VALUES
  -- Imagen 3 (High-quality image generation)
  (
    'gemini',
    'imagen-3.0-generate-002',
    'Imagen 3',
    'Google Gemini',
    '{"text": false, "image": true, "reasoning": false}'::jsonb,
    '{"input": 0, "output": 20.00, "currency": "USD", "per_tokens": 0, "per_image": 1}'::jsonb,
    '{"speed": "medium", "intelligence": "high"}'::jsonb,
    0,
    true,
    '{"aspect_ratio": "1:1", "number_of_images": 1, "safety_filter_level": "block_some"}'::jsonb
  ),

  -- Gemini 2.0 Flash Experimental (multimodal with image generation)
  (
    'gemini',
    'gemini-2.0-flash-exp',
    'Gemini 2.0 Flash (Experimental)',
    'Google Gemini',
    '{"text": true, "image": true, "reasoning": false}'::jsonb,
    '{"input": 0, "output": 0, "currency": "USD", "per_tokens": 1000000}'::jsonb,
    '{"speed": "very fast", "intelligence": "high"}'::jsonb,
    1048576,
    true,
    '{"temperature": 0.7, "max_tokens": 8192}'::jsonb
  ),

  -- Gemini 3 Pro Image (Nano Banana Pro) - Premium 4K generation
  (
    'gemini',
    'gemini-3-pro-image-preview',
    'Gemini 3 Pro Image (Nano Banana Pro)',
    'Google Gemini',
    '{"text": false, "image": true, "reasoning": true}'::jsonb,
    '{"input": 0, "output": 100.00, "currency": "USD", "per_tokens": 0, "per_image": 1}'::jsonb,
    '{"speed": "slow", "intelligence": "very high"}'::jsonb,
    0,
    true,
    '{"resolution": "4K", "watermark": "synthid", "grounding": true}'::jsonb
  )

ON CONFLICT (provider_type, model_id) DO UPDATE SET
  capabilities = EXCLUDED.capabilities,
  pricing = EXCLUDED.pricing,
  model_config = EXCLUDED.model_config;

-- =====================================================
-- Set default image models for providers
-- =====================================================

-- OpenAI: DALL-E 3 standard
UPDATE ai_provider_configs
SET default_model_id_for_images = (
  SELECT id FROM ai_models
  WHERE provider_type = 'openai' AND model_id = 'dall-e-3'
  LIMIT 1
)
WHERE provider_type = 'openai';

-- AiTunnel: Gemini 2.5 Flash Image (cheapest and fastest)
UPDATE ai_provider_configs
SET default_model_id_for_images = (
  SELECT id FROM ai_models
  WHERE provider_type = 'aitunnel' AND model_id = 'gemini-2.5-flash-image'
  LIMIT 1
)
WHERE provider_type = 'aitunnel';

-- NeuroAPI: Gemini 2.5 Flash Image (cheapest and fastest)
UPDATE ai_provider_configs
SET default_model_id_for_images = (
  SELECT id FROM ai_models
  WHERE provider_type = 'neuroapi' AND model_id = 'gemini-2.5-flash-image'
  LIMIT 1
)
WHERE provider_type = 'neuroapi';

-- Gemini: Imagen 3 (best balance of quality and price)
UPDATE ai_provider_configs
SET default_model_id_for_images = (
  SELECT id FROM ai_models
  WHERE provider_type = 'gemini' AND model_id = 'imagen-3.0-generate-002'
  LIMIT 1
)
WHERE provider_type = 'gemini';

-- =====================================================
-- Migration Complete!
-- =====================================================
-- Added image generation models:
-- - OpenAI: dall-e-3, dall-e-3-hd
-- - AiTunnel: dall-e-3, gpt-image-1, qwen-image-edit, gemini-2.5-flash-image, gemini-3-pro-image-preview (RUB pricing)
-- - NeuroAPI: dall-e-3, gpt-image-1, gemini-2.5-flash-image, gemini-3-pro-image-preview
-- - Gemini: imagen-3.0-generate-002, gemini-2.0-flash-exp, gemini-3-pro-image-preview
--
-- Note: Claude does NOT support image generation natively
-- =====================================================
