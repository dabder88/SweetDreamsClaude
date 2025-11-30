-- =====================================================
-- Update NeuroAPI Text Generation Models
-- =====================================================
-- This script updates all text/chat completion models for NeuroAPI provider
-- Collected from https://neuroapi.host/dashboard/price (2025-01-31)
-- Currency: RUB (Russian Rubles)
-- =====================================================

-- Delete old NeuroAPI text models (keep image/embedding/TTS models unchanged)
DELETE FROM ai_models
WHERE provider_type = 'neuroapi'
  AND capabilities->>'text' = 'true'
  AND (capabilities->>'image' IS NULL OR capabilities->>'image' = 'false');

-- =====================================================
-- Insert New NeuroAPI Text Generation Models
-- =====================================================

INSERT INTO ai_models (provider_type, model_id, model_name, provider_name, capabilities, pricing, performance, context_length, is_available)
VALUES
  -- ==============================================================================
  -- OPENAI MODELS
  -- ==============================================================================

  -- GPT-5 Series (Latest Models)
  ('neuroapi', 'gpt-5-codex', 'GPT-5 Codex', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 78.23, "output": 625.83, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "fast"}'::jsonb,
   400000, true),

  ('neuroapi', 'gpt-5.1', 'GPT-5.1', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 78.23, "output": 625.83, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "fast"}'::jsonb,
   128000, true),

  ('neuroapi', 'gpt-5.1-thinking', 'GPT-5.1 Thinking', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 78.23, "output": 625.83, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "slow"}'::jsonb,
   128000, true),

  ('neuroapi', 'gpt-5', 'GPT-5', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 87.62, "output": 700.93, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   400000, true),

  ('neuroapi', 'gpt-5-2025-08-07', 'GPT-5 (2025-08-07)', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 87.62, "output": 700.93, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   400000, true),

  ('neuroapi', 'gpt-5-chat-2025-08-07', 'GPT-5 Chat (2025-08-07)', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 87.62, "output": 700.93, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   400000, true),

  ('neuroapi', 'gpt-5-chat-latest', 'GPT-5 Chat Latest', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 87.62, "output": 700.93, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "fastest"}'::jsonb,
   400000, true),

  ('neuroapi', 'gpt-5-thinking-all', 'GPT-5 Thinking All', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 87.62, "output": 700.93, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   400000, true),

  ('neuroapi', 'gpt-5-mini', 'GPT-5 Mini', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 16.90, "output": 135.18, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   400000, true),

  ('neuroapi', 'gpt-5-mini-2025-08-07', 'GPT-5 Mini (2025-08-07)', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 16.90, "output": 135.18, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   400000, true),

  ('neuroapi', 'gpt-5-nano', 'GPT-5 Nano', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 3.38, "output": 27.04, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fastest"}'::jsonb,
   400000, true),

  ('neuroapi', 'gpt-5-nano-2025-08-07', 'GPT-5 Nano (2025-08-07)', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 3.38, "output": 27.04, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "slow"}'::jsonb,
   400000, true),

  -- GPT-4.1 Series
  ('neuroapi', 'gpt-4.1', 'GPT-4.1', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 137.68, "output": 550.73, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "fast"}'::jsonb,
   1000000, true),

  ('neuroapi', 'gpt-4.1-2025-04-14', 'GPT-4.1 (2025-04-14)', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 137.68, "output": 550.73, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "fast"}'::jsonb,
   1000000, true),

  ('neuroapi', 'gpt-4.1-mini', 'GPT-4.1 Mini', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 25.03, "output": 100.13, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   1000000, true),

  ('neuroapi', 'gpt-4.1-mini-2025-04-14', 'GPT-4.1 Mini (2025-04-14)', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 25.03, "output": 100.13, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   1000000, true),

  ('neuroapi', 'gpt-4.1-nano', 'GPT-4.1 Nano', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 6.26, "output": 25.03, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fastest"}'::jsonb,
   1000000, true),

  ('neuroapi', 'gpt-4.1-nano-2025-04-14', 'GPT-4.1 Nano (2025-04-14)', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 6.26, "output": 25.03, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fastest"}'::jsonb,
   1000000, true),

  -- GPT-4o Series
  ('neuroapi', 'chatgpt-4o-latest', 'ChatGPT-4o Latest', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 156.46, "output": 469.37, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  ('neuroapi', 'gpt-4o', 'GPT-4o', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 156.46, "output": 625.83, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  ('neuroapi', 'gpt-4o-2024-11-20', 'GPT-4o (2024-11-20)', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 156.46, "output": 625.83, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  ('neuroapi', 'gpt-4o-audio-preview', 'GPT-4o Audio Preview', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 312.91, "output": 1251.65, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   128000, true),

  ('neuroapi', 'gpt-4o-mini', 'GPT-4o Mini', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 10.14, "output": 40.55, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fast"}'::jsonb,
   128000, true),

  -- O-Series (Reasoning Models)
  ('neuroapi', 'o3-pro', 'O3 Pro', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 1251.65, "output": 5006.62, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   200000, true),

  ('neuroapi', 'o3', 'O3', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 137.68, "output": 550.73, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   200000, true),

  ('neuroapi', 'o3-mini', 'O3 Mini', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 68.84, "output": 275.36, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   200000, true),

  ('neuroapi', 'o4-mini', 'O4 Mini', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 73.85, "output": 295.39, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "fast"}'::jsonb,
   200000, true),

  ('neuroapi', 'o1', 'O1', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 938.74, "output": 3754.96, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "slow"}'::jsonb,
   128000, true),

  ('neuroapi', 'o1-mini', 'O1 Mini', 'OpenAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 187.75, "output": 750.99, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "medium"}'::jsonb,
   128000, true),

  -- Legacy Models
  ('neuroapi', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 31.29, "output": 93.87, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "medium"}'::jsonb,
   16000, true),

  ('neuroapi', 'gpt-4-turbo', 'GPT-4 Turbo', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 625.83, "output": 1877.48, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fast"}'::jsonb,
   128000, true),

  ('neuroapi', 'babbage-002', 'Babbage-002', 'OpenAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 25.03, "output": 25.03, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "fast"}'::jsonb,
   16000, true),

  -- ==============================================================================
  -- GOOGLE MODELS
  -- ==============================================================================

  ('neuroapi', 'gemini-3-pro-preview', 'Gemini 3 Pro Preview', 'Google',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 125.17, "output": 750.99, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "fastest"}'::jsonb,
   1000000, true),

  ('neuroapi', 'gemini-3-pro-preview-thinking', 'Gemini 3 Pro Preview Thinking', 'Google',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 125.17, "output": 750.99, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "fast"}'::jsonb,
   1000000, true),

  ('neuroapi', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 'Google',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 18.77, "output": 156.45, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   1000000, true),

  ('neuroapi', 'gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'Google',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 7.51, "output": 30.04, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "fastest"}'::jsonb,
   1000000, true),

  ('neuroapi', 'gemini-2.5-pro', 'Gemini 2.5 Pro', 'Google',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 87.62, "output": 700.93, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   1000000, true),

  ('neuroapi', 'gemini-2.0-flash', 'Gemini 2.0 Flash', 'Google',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 6.26, "output": 25.03, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fastest"}'::jsonb,
   1000000, true),

  ('neuroapi', 'gemini-2.0-pro-exp', 'Gemini 2.0 Pro Exp', 'Google',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 156.46, "output": 625.83, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "medium"}'::jsonb,
   1000000, true),

  -- ==============================================================================
  -- ANTHROPIC (CLAUDE) MODELS
  -- ==============================================================================

  ('neuroapi', 'claude-opus-4-1-20250805', 'Claude Opus 4.1 (2025-08-05)', 'Anthropic',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 1063.91, "output": 5319.53, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-opus-4-1-20250805-thinking', 'Claude Opus 4.1 (2025-08-05) Thinking', 'Anthropic',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 1063.91, "output": 5319.53, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5 (2025-09-29)', 'Anthropic',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 244.07, "output": 1220.36, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "fast"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-sonnet-4-5-20250929-thinking', 'Claude Sonnet 4.5 (2025-09-29) Thinking', 'Anthropic',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 350.46, "output": 1752.32, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-3-5-sonnet-all', 'Claude 3.5 Sonnet All', 'Anthropic',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 250.33, "output": 1251.65, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fast"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-3-7-sonnet-20250219', 'Claude 3.7 Sonnet (2025-02-19)', 'Anthropic',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 187.75, "output": 938.74, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-3-7-sonnet-all', 'Claude 3.7 Sonnet All', 'Anthropic',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 187.75, "output": 938.74, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-3-7-sonnet-thinking-all', 'Claude 3.7 Sonnet Thinking All', 'Anthropic',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 250.33, "output": 1251.65, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "medium"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-haiku-4-5-20251001', 'Claude Haiku 4.5 (2025-10-01)', 'Anthropic',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 62.58, "output": 312.91, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "slow"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-haiku-4-5-20251001-thinking', 'Claude Haiku 4.5 (2025-10-01) Thinking', 'Anthropic',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 62.58, "output": 312.91, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "slow"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-opus-4-20250514', 'Claude Opus 4 (2025-05-14)', 'Anthropic',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 938.74, "output": 4693.70, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "slow"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-opus-4-20250514-thinking', 'Claude Opus 4 (2025-05-14) Thinking', 'Anthropic',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 938.74, "output": 4693.70, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "slow"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-opus-4-all', 'Claude Opus 4 All', 'Anthropic',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 938.74, "output": 4693.70, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-opus-4-thinking-all', 'Claude Opus 4 Thinking All', 'Anthropic',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 938.74, "output": 4693.70, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "slow"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-sonnet-4-20250514', 'Claude Sonnet 4 (2025-05-14)', 'Anthropic',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 212.78, "output": 1063.91, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-sonnet-4-20250514-thinking', 'Claude Sonnet 4 (2025-05-14) Thinking', 'Anthropic',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 212.78, "output": 1063.91, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "medium"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-sonnet-4-all', 'Claude Sonnet 4 All', 'Anthropic',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 187.75, "output": 938.74, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-sonnet-4-thinking-all', 'Claude Sonnet 4 Thinking All', 'Anthropic',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 206.52, "output": 1032.61, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "medium"}'::jsonb,
   200000, true),

  ('neuroapi', 'claude-3-haiku-all', 'Claude 3 Haiku All', 'Anthropic',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 15.65, "output": 78.23, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "medium", "speed": "fast"}'::jsonb,
   200000, true),

  -- ==============================================================================
  -- DEEPSEEK MODELS
  -- ==============================================================================

  ('neuroapi', 'deepseek-v3.1', 'DeepSeek V3.1', 'DeepSeek',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 150.20, "output": 450.60, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "slow"}'::jsonb,
   164000, true),

  ('neuroapi', 'deepseek-v3.2-exp', 'DeepSeek V3.2 Exp', 'DeepSeek',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 75.10, "output": 112.65, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "low", "speed": "slow"}'::jsonb,
   164000, true),

  ('neuroapi', 'deepseek-reasoner', 'DeepSeek Reasoner', 'DeepSeek',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 125.17, "output": 500.66, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "slow"}'::jsonb,
   164000, true),

  ('neuroapi', 'deepseek-v3-0324', 'DeepSeek V3 (03-24)', 'DeepSeek',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 125.17, "output": 500.66, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   164000, true),

  -- ==============================================================================
  -- XAI (GROK) MODELS
  -- ==============================================================================

  ('neuroapi', 'grok-3-all', 'Grok 3 All', 'XAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 93.87, "output": 469.37, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "high", "speed": "fast"}'::jsonb,
   131000, true),

  ('neuroapi', 'grok-3-reasoner', 'Grok 3 Reasoner', 'XAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 187.75, "output": 938.74, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   131000, true),

  ('neuroapi', 'grok-4', 'Grok 4', 'XAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 225.30, "output": 1126.49, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "medium"}'::jsonb,
   256000, true),

  ('neuroapi', 'grok-4-fast', 'Grok 4 Fast', 'XAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 18.77, "output": 46.94, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "fastest"}'::jsonb,
   2000000, true),

  ('neuroapi', 'grok-4-fast-non-reasoning', 'Grok 4 Fast Non-Reasoning', 'XAI',
   '{"text": true, "image": false, "reasoning": false}'::jsonb,
   '{"input": 18.77, "output": 46.94, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "fastest"}'::jsonb,
   2000000, true),

  ('neuroapi', 'grok-4-fast-reasoning', 'Grok 4 Fast Reasoning', 'XAI',
   '{"text": true, "image": false, "reasoning": true}'::jsonb,
   '{"input": 18.77, "output": 46.94, "currency": "RUB", "per": "1M tokens"}'::jsonb,
   '{"intelligence": "highest", "speed": "fastest"}'::jsonb,
   2000000, true)

ON CONFLICT (provider_type, model_id) DO NOTHING;

-- =====================================================
-- Update Default Model for NeuroAPI
-- =====================================================

UPDATE ai_provider_configs
SET default_model_id_for_text = (
  SELECT id FROM ai_models
  WHERE provider_type = 'neuroapi' AND model_id = 'gpt-5-mini'
  LIMIT 1
)
WHERE provider_type = 'neuroapi';

-- =====================================================
-- Migration Complete!
-- =====================================================
-- NeuroAPI now has 68 text generation models
-- Default model: gpt-5-mini (optimal price/performance)
-- Currency: RUB (Russian Rubles)
-- =====================================================
