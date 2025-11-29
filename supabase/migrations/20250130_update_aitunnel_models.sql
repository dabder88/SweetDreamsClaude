-- =====================================================
-- Update AiTunnel Models List
-- =====================================================
-- This migration updates ALL text/chat completion models for AiTunnel
-- Based on actual data from https://aitunnel.ru/ (collected 2025-01-30)
-- =====================================================

-- =====================================================
-- STEP 1: Remove old AiTunnel text models
-- =====================================================
DELETE FROM ai_models
WHERE provider_type = 'aitunnel'
  AND capabilities->>'text' = 'true'
  AND (capabilities->>'image' IS NULL OR capabilities->>'image' = 'false');

-- =====================================================
-- STEP 2: Insert ALL AiTunnel text/chat models (52 models)
-- =====================================================

INSERT INTO ai_models (provider_type, model_id, model_name, provider_name, capabilities, pricing, performance, context_length, is_available)
VALUES
  -- ============ OpenAI Models (17) ============
  ('aitunnel', 'gpt-5.1', 'GPT-5.1', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 22.5, "output": 1800, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-5.1-chat', 'GPT-5.1 Chat', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 22.5, "output": 1800, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-5.1-codex', 'GPT-5.1 Codex', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 22.5, "output": 1800, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-5.1-codex-mini', 'GPT-5.1 Codex Mini', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 27, "output": 1080, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-5-nano', 'GPT-5 Nano', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 0.9, "output": 72, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fastest"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-5-mini', 'GPT-5 Mini', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 4.5, "output": 360, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-5', 'GPT-5', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 22.5, "output": 1800, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-5-pro', 'GPT-5 Pro', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 270, "output": 21600, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-4.1-nano', 'GPT-4.1 Nano', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 9, "output": 72, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fast"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-4.1-mini', 'GPT-4.1 Mini', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 36, "output": 288, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-4.1', 'GPT-4.1', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 180, "output": 1440, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-4o-mini', 'GPT-4o Mini', 'OpenAI',
   '{"text": true, "image": true, "reasoning": false}'::jsonb,
   '{"input": 13.5, "output": 108, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-4o-mini-search-preview', 'GPT-4o Mini Search Preview', 'OpenAI',
   '{"text": true, "image": true, "reasoning": false, "search": true}'::jsonb,
   '{"input": 13.5, "output": 108, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-4o-search-preview', 'GPT-4o Search Preview', 'OpenAI',
   '{"text": true, "image": true, "reasoning": false, "search": true}'::jsonb,
   '{"input": 225, "output": 1800, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-4o', 'GPT-4o', 'OpenAI',
   '{"text": true, "image": true, "reasoning": false}'::jsonb,
   '{"input": 225, "output": 1800, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-4o-audio-preview', 'GPT-4o Audio Preview', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false, "audio": true}'::jsonb,
   '{"input": 450, "output": 1800, "currency": "RUB", "per": "1M tokens", "audio_input": 7200, "audio_output": 14400}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'gpt-4o-mini-audio-preview', 'GPT-4o Mini Audio Preview', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false, "audio": true}'::jsonb,
   '{"input": 27, "output": 108, "currency": "RUB", "per": "1M tokens", "audio_input": 1800, "audio_output": 3600}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  -- ============ Google Models (6) ============
  ('aitunnel', 'gemini-3-pro-preview', 'Gemini 3 Pro Preview', 'Google',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 360, "output": 2160, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   1000000, true),

  ('aitunnel', 'gemini-3-pro-image-preview', 'Gemini 3 Pro Image Preview', 'Google',
   '{"text": true, "image": true, "reasoning": true}'::jsonb,
   '{"input": 360, "output": 2160, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   1000000, true),

  ('aitunnel', 'gemini-2.5-flash-image', 'Gemini 2.5 Flash Image', 'Google',
   '{"text": true, "image": true, "reasoning": false}'::jsonb,
   '{"input": 54, "output": 450, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fastest"}'::jsonb,
   1000000, true),

  ('aitunnel', 'gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'Google',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 18, "output": 72, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fastest"}'::jsonb,
   1000000, true),

  ('aitunnel', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 'Google',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 54, "output": 450, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fastest"}'::jsonb,
   1000000, true),

  ('aitunnel', 'gemini-2.5-pro', 'Gemini 2.5 Pro', 'Google',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 225, "output": 1800, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   1000000, true),

  -- ============ Anthropic Models (3) ============
  ('aitunnel', 'claude-haiku-4.5', 'Claude Haiku 4.5', 'Anthropic',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 180, "output": 900, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fastest"}'::jsonb,
   200000, true),

  ('aitunnel', 'claude-sonnet-4.5', 'Claude Sonnet 4.5', 'Anthropic',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 540, "output": 2700, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   200000, true),

  ('aitunnel', 'claude-opus-4.5', 'Claude Opus 4.5', 'Anthropic',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 900, "output": 4500, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   200000, true),

  -- ============ DeepSeek Models (4) ============
  ('aitunnel', 'deepseek-v3.2-exp', 'DeepSeek V3.2 Experimental', 'DeepSeek',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 48.6, "output": 73.8, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   64000, true),

  ('aitunnel', 'deepseek-r1-0528', 'DeepSeek R1 (0528)', 'DeepSeek',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 90, "output": 392.4, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   64000, true),

  ('aitunnel', 'deepseek-v3.1-terminus', 'DeepSeek V3.1 Terminus', 'DeepSeek',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 48.6, "output": 180, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   64000, true),

  ('aitunnel', 'deepseek-chat-v3.1', 'DeepSeek Chat V3.1', 'DeepSeek',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 48.6, "output": 198, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   64000, true),

  -- ============ Meta Llama Models (3) ============
  ('aitunnel', 'llama-4-scout', 'Llama 4 Scout', 'Meta',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 14.4, "output": 81, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  ('aitunnel', 'llama-4-maverick', 'Llama 4 Maverick', 'Meta',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 36, "output": 108, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'llama-3.3-70b-instruct', 'Llama 3.3 70B Instruct', 'Meta',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 21.6, "output": 54, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "medium"}'::jsonb,
   128000, true),

  -- ============ Perplexity Models (4) ============
  ('aitunnel', 'sonar', 'Sonar', 'Perplexity',
   '{"text": true, "image": true, "reasoning": false}'::jsonb,
   '{"input": 180, "output": 180, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  ('aitunnel', 'sonar-pro', 'Sonar Pro', 'Perplexity',
   '{"text": true, "image": true, "reasoning": false}'::jsonb,
   '{"input": 540, "output": 2700, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'sonar-pro-search', 'Sonar Pro Search', 'Perplexity',
   '{"text": true, "image": true, "reasoning": false, "search": true}'::jsonb,
   '{"input": 540, "output": 2700, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'sonar-deep-research', 'Sonar Deep Research', 'Perplexity',
   '{"text": true, "image": true, "reasoning": true, "search": true}'::jsonb,
   '{"input": 360, "output": 1440, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   128000, true),

  -- ============ xAI Models (3) ============
  ('aitunnel', 'grok-4.1-fast', 'Grok 4.1 Fast', 'xAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 36, "output": 90, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fastest"}'::jsonb,
   128000, true),

  ('aitunnel', 'grok-4', 'Grok 4', 'xAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 540, "output": 2700, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'grok-code-fast-1', 'Grok Code Fast 1', 'xAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 36, "output": 270, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  -- ============ Qwen Models (5) ============
  ('aitunnel', 'qwen3-235b-a22b-2507', 'Qwen3 235B-A22B', 'Qwen',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 14.04, "output": 56.16, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'qwen3-30b-a3b', 'Qwen3 30B-A3B', 'Qwen',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 3.6, "output": 14.4, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fast"}'::jsonb,
   128000, true),

  ('aitunnel', 'qwen3-coder', 'Qwen3 Coder', 'Qwen',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 36, "output": 144, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'qwen3-coder-30b-a3b-instruct', 'Qwen3 Coder 30B-A3B Instruct', 'Qwen',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 10.8, "output": 45, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'qwen3-max', 'Qwen3 Max', 'Qwen',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 216, "output": 1080, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  -- ============ MistralAI Models (5) ============
  ('aitunnel', 'mistral-small-3.2-24b-instruct', 'Mistral Small 3.2 24B Instruct', 'MistralAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 10.8, "output": 32.4, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fast"}'::jsonb,
   128000, true),

  ('aitunnel', 'mistral-medium-3.1', 'Mistral Medium 3.1', 'MistralAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 72, "output": 360, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'codestral-2508', 'Codestral 2508', 'MistralAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 54, "output": 162, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'devstral-small', 'Devstral Small', 'MistralAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 12.6, "output": 50.4, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fast"}'::jsonb,
   128000, true),

  ('aitunnel', 'mistral-nemo', 'Mistral Nemo', 'MistralAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 3.6, "output": 7.2, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fastest"}'::jsonb,
   128000, true),

  -- ============ MoonshotAI Models (2) ============
  ('aitunnel', 'kimi-k2-thinking', 'Kimi K2 Thinking', 'MoonshotAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 81, "output": 423, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "medium"}'::jsonb,
   128000, true),

  ('aitunnel', 'kimi-k2-0905', 'Kimi K2 (0905)', 'MoonshotAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 70.2, "output": 342, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "medium"}'::jsonb,
   128000, true)

ON CONFLICT (provider_type, model_id) DO UPDATE SET
  model_name = EXCLUDED.model_name,
  provider_name = EXCLUDED.provider_name,
  capabilities = EXCLUDED.capabilities,
  pricing = EXCLUDED.pricing,
  performance = EXCLUDED.performance,
  context_length = EXCLUDED.context_length,
  is_available = EXCLUDED.is_available;

-- =====================================================
-- STEP 3: Update default model for AiTunnel
-- =====================================================
-- Set gpt-5-mini as default (optimal balance of price/quality)
UPDATE ai_provider_configs
SET default_model_id = (
  SELECT id FROM ai_models
  WHERE provider_type = 'aitunnel' AND model_id = 'gpt-5-mini'
  LIMIT 1
)
WHERE provider_type = 'aitunnel';

-- =====================================================
-- Migration Complete!
-- =====================================================
-- AiTunnel now has 52 text/chat models available
-- All models are sorted by price (cheapest first)
-- Image generation models remain unchanged
-- =====================================================
