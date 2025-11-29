-- =====================================================
-- AI Provider Management System - Seed Data
-- =====================================================
-- This script populates initial AI providers and TOP-20 models
-- Based on AiTunnel and NeuroAPI pricing documentation
-- =====================================================

-- =====================================================
-- STEP 1: Insert AI Provider Configurations
-- =====================================================

INSERT INTO ai_provider_configs (provider_type, provider_name, is_active, api_key_env_name, base_url, config)
VALUES
  -- Gemini (currently active by default)
  ('gemini', 'Google Gemini', true, 'VITE_API_KEY', 'https://generativelanguage.googleapis.com',
   '{"temperature": 0.4, "max_tokens": 8192}'::jsonb),

  -- AiTunnel (Russian intermediary, Ruble pricing)
  ('aitunnel', 'AiTunnel', false, 'VITE_AITUNNEL_KEY', 'https://api.aitunnel.ru/v1',
   '{"temperature": 0.4, "max_tokens": 8192}'::jsonb),

  -- NeuroAPI (International intermediary, USD pricing)
  ('neuroapi', 'NeuroAPI', false, 'VITE_NEUROAPI_KEY', 'https://neuroapi.host/v1',
   '{"temperature": 0.4, "max_tokens": 8192}'::jsonb),

  -- OpenAI Direct
  ('openai', 'OpenAI Direct', false, 'VITE_OPENAI_KEY', 'https://api.openai.com/v1',
   '{"temperature": 0.4, "max_tokens": 8192}'::jsonb),

  -- Claude/Anthropic Direct
  ('claude', 'Anthropic Claude', false, 'VITE_CLAUDE_KEY', 'https://api.anthropic.com',
   '{"temperature": 0.4, "max_tokens": 8192}'::jsonb)
ON CONFLICT (provider_type) DO UPDATE SET
  config = EXCLUDED.config;

-- =====================================================
-- STEP 2: Insert TOP-10 Models for AiTunnel (Rubles)
-- =====================================================

INSERT INTO ai_models (provider_type, model_id, model_name, provider_name, capabilities, pricing, performance, context_length, is_available)
VALUES
  -- 1. GPT-5 Nano - Ultra cheap, fast
  ('aitunnel', 'gpt-5-nano', 'GPT-5 Nano', 'AiTunnel',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 0.9, "output": 72, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fastest"}'::jsonb,
   128000, true),

  -- 2. GPT-5 Mini - Optimal balance
  ('aitunnel', 'gpt-5-mini', 'GPT-5 Mini', 'AiTunnel',
   '{"text": true, "image": true, "reasoning": false}'::jsonb,
   '{"input": 4.5, "output": 360, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  -- 3. GPT-5 - Premium quality
  ('aitunnel', 'gpt-5', 'GPT-5', 'AiTunnel',
   '{"text": true, "image": true, "reasoning": true}'::jsonb,
   '{"input": 22.5, "output": 1800, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  -- 4. Claude Sonnet 4.5 - Best quality
  ('aitunnel', 'claude-sonnet-4.5', 'Claude Sonnet 4.5', 'AiTunnel',
   '{"text": true, "image": true, "reasoning": true}'::jsonb,
   '{"input": 540, "output": 2700, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   200000, true),

  -- 5. DeepSeek R1 - Reasoning specialist
  ('aitunnel', 'deepseek-r1-0528', 'DeepSeek R1 (0528)', 'AiTunnel',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 90, "output": 392.4, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   64000, true),

  -- 6. Gemini 2.5 Flash - Fast and cheap
  ('aitunnel', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 'AiTunnel',
   '{"text": true, "image": true, "reasoning": false}'::jsonb,
   '{"input": 5.4, "output": 180, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fastest"}'::jsonb,
   1000000, true),

  -- 7. GPT-4o Mini - Classic reliable
  ('aitunnel', 'gpt-4o-mini', 'GPT-4o Mini', 'AiTunnel',
   '{"text": true, "image": true, "reasoning": false}'::jsonb,
   '{"input": 9, "output": 180, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  -- 8. Mistral Large - European alternative
  ('aitunnel', 'mistral-large-2411', 'Mistral Large', 'AiTunnel',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 180, "output": 540, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "medium"}'::jsonb,
   128000, true),

  -- 9. Llama 3.3 70B - Open source power
  ('aitunnel', 'llama-3.3-70b', 'Llama 3.3 70B', 'AiTunnel',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 54, "output": 81, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "medium"}'::jsonb,
   128000, true),

  -- 10. DeepSeek V3 - Chinese powerhouse
  ('aitunnel', 'deepseek-v3', 'DeepSeek V3', 'AiTunnel',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 16.2, "output": 65.7, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   64000, true)
ON CONFLICT (provider_type, model_id) DO NOTHING;

-- =====================================================
-- STEP 3: Insert TOP-10 Models for NeuroAPI (USD)
-- =====================================================

INSERT INTO ai_models (provider_type, model_id, model_name, provider_name, capabilities, pricing, performance, context_length, is_available)
VALUES
  -- 1. GPT-5 Nano - Ultra cheap
  ('neuroapi', 'gpt-5-nano', 'GPT-5 Nano', 'NeuroAPI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 0.04, "output": 0.35, "currency": "USD", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fastest"}'::jsonb,
   128000, true),

  -- 2. GPT-5 Mini - Optimal
  ('neuroapi', 'gpt-5-mini', 'GPT-5 Mini', 'NeuroAPI',
   '{"text": true, "image": true, "reasoning": false}'::jsonb,
   '{"input": 0.22, "output": 1.73, "currency": "USD", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  -- 3. GPT-5 - Premium
  ('neuroapi', 'gpt-5', 'GPT-5', 'NeuroAPI',
   '{"text": true, "image": true, "reasoning": true}'::jsonb,
   '{"input": 1.12, "output": 8.96, "currency": "USD", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  -- 4. Claude Sonnet 4.5 - Latest version
  ('neuroapi', 'claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5 (2025-09-29)', 'NeuroAPI',
   '{"text": true, "image": true, "reasoning": true}'::jsonb,
   '{"input": 3.12, "output": 15.60, "currency": "USD", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   200000, true),

  -- 5. Gemini 2.5 Flash - Google's fast model
  ('neuroapi', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 'NeuroAPI',
   '{"text": true, "image": true, "reasoning": false}'::jsonb,
   '{"input": 0.24, "output": 2.00, "currency": "USD", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fastest"}'::jsonb,
   1000000, true),

  -- 6. GPT-4o - Classic OpenAI
  ('neuroapi', 'gpt-4o', 'GPT-4o', 'NeuroAPI',
   '{"text": true, "image": true, "reasoning": false}'::jsonb,
   '{"input": 2.50, "output": 10.00, "currency": "USD", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   128000, true),

  -- 7. Claude Opus 4 - Maximum intelligence
  ('neuroapi', 'claude-opus-4-20250514', 'Claude Opus 4 (2025-05-14)', 'NeuroAPI',
   '{"text": true, "image": true, "reasoning": true}'::jsonb,
   '{"input": 18.75, "output": 93.75, "currency": "USD", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   200000, true),

  -- 8. Gemini 2.0 Flash Thinking - Google reasoning
  ('neuroapi', 'gemini-2.0-flash-thinking-exp-01-21', 'Gemini 2.0 Flash Thinking', 'NeuroAPI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 0.00, "output": 0.00, "currency": "USD", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   32000, true),

  -- 9. DeepSeek R1 - Best reasoning model
  ('neuroapi', 'deepseek-r1', 'DeepSeek R1', 'NeuroAPI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 0.55, "output": 2.19, "currency": "USD", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   64000, true),

  -- 10. Llama 3.1 405B - Largest open source
  ('neuroapi', 'llama-3.1-405b', 'Llama 3.1 405B', 'NeuroAPI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 2.70, "output": 2.70, "currency": "USD", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   128000, true)
ON CONFLICT (provider_type, model_id) DO NOTHING;

-- =====================================================
-- STEP 4: Set Default Models for Each Provider
-- =====================================================

-- Update Gemini provider (add default model when gemini models are added)
-- UPDATE ai_provider_configs
-- SET default_model_id = (SELECT id FROM ai_models WHERE provider_type = 'gemini' AND model_id = 'gemini-2.5-flash' LIMIT 1)
-- WHERE provider_type = 'gemini';

-- Update AiTunnel provider with default model (gpt-5-mini)
UPDATE ai_provider_configs
SET default_model_id = (SELECT id FROM ai_models WHERE provider_type = 'aitunnel' AND model_id = 'gpt-5-mini' LIMIT 1)
WHERE provider_type = 'aitunnel';

-- Update NeuroAPI provider with default model (gpt-5-mini)
UPDATE ai_provider_configs
SET default_model_id = (SELECT id FROM ai_models WHERE provider_type = 'neuroapi' AND model_id = 'gpt-5-mini' LIMIT 1)
WHERE provider_type = 'neuroapi';

-- =====================================================
-- Seed Complete!
-- =====================================================
-- You now have:
-- - 5 AI provider configurations (Gemini active by default)
-- - 20 top models (10 from AiTunnel, 10 from NeuroAPI)
-- - Default models set for each provider
--
-- Next steps:
-- 1. Add environment variables to .env file
-- 2. Update TypeScript types in types.ts
-- 3. Install npm dependencies (openai, @anthropic-ai/sdk)
-- =====================================================
