/**
 * BaseProvider - Abstract base class for all AI providers
 *
 * Provides common functionality for:
 * - API key retrieval from environment variables
 * - Prompt building for dream analysis
 * - Response validation and normalization
 *
 * All concrete providers (Gemini, OpenAI, Claude) must extend this class
 * and implement the abstract methods.
 */

import type { DreamData, AnalysisResponse, AIProviderConfig, AIModel, DreamSymbol } from '../../../types';

export abstract class BaseProvider {
  protected config: AIProviderConfig;
  protected model: AIModel;

  constructor(config: AIProviderConfig, model: AIModel) {
    this.config = config;
    this.model = model;
  }

  // =====================================================
  // Abstract Methods (must be implemented by subclasses)
  // =====================================================

  /**
   * Analyze dream using AI model
   * @param dreamData - Dream description and context
   * @returns Structured analysis response
   */
  abstract analyzeDream(dreamData: DreamData): Promise<AnalysisResponse>;

  /**
   * Generate visualization image for dream
   * @param prompt - Image generation prompt
   * @returns Base64 data URL of generated image
   */
  abstract generateImage(prompt: string): Promise<string>;

  // =====================================================
  // Common Utility Methods
  // =====================================================

  /**
   * Get API key from environment variables
   * Uses api_key_env_name from config to determine which env var to read
   */
  protected getApiKey(): string {
    const envName = this.config.api_key_env_name || 'VITE_API_KEY';

    // Try Vite import.meta.env first (client-side)
    if (import.meta.env[envName]) {
      return import.meta.env[envName];
    }

    // Fallback to process.env (server-side, legacy)
    if (typeof process !== 'undefined' && process.env?.[envName]) {
      return process.env[envName];
    }

    console.warn(`API key not found in environment: ${envName}`);
    return '';
  }

  /**
   * Build analysis prompt from dream data
   * This is a basic implementation - providers can override for custom prompts
   */
  protected buildPrompt(dreamData: DreamData): string {
    const { description, context, method } = dreamData;

    // Method-specific prompts
    const methodPrompts: Record<string, string> = {
      jungian: 'Проанализируй сон с точки зрения юнгианской психологии. Обрати внимание на архетипы, коллективное бессознательное, символы из мифологии.',
      freudian: 'Проанализируй сон с точки зрения психоанализа Фрейда. Обрати внимание на скрытые желания, вытесненные конфликты, символику.',
      gestalt: 'Проанализируй сон с точки зрения гештальт-терапии. Рассмотри каждый элемент сна как проекцию личности.',
      cognitive: 'Проанализируй сон с точки зрения когнитивной психологии. Обрати внимание на когнитивные искажения, убеждения, паттерны мышления.',
      existential: 'Проанализируй сон с точки зрения экзистенциальной психологии. Обрати внимание на вопросы смысла, свободы, ответственности.',
      auto: 'Проанализируй сон, используя наиболее подходящий психологический подход.'
    };

    const methodPrompt = methodPrompts[method] || methodPrompts.auto;

    return `${methodPrompt}

ОПИСАНИЕ СНА:
${description}

КОНТЕКСТ:
- Эмоция при пробуждении: ${context.emotion}
- Жизненная ситуация: ${context.lifeSituation}
- Ассоциации: ${context.associations}
- Повторяющийся сон: ${context.recurring ? 'Да' : 'Нет'}
- Остаток дня: ${context.dayResidue}
- Типы персонажей: ${context.characterType}
- Роль в сне: ${context.dreamRole}
- Физические ощущения: ${context.physicalSensation}

ФОРМАТ ОТВЕТА (строго JSON):
{
  "summary": "Краткое резюме (2-3 предложения)",
  "symbolism": [
    {"name": "Символ 1", "meaning": "Значение символа"},
    {"name": "Символ 2", "meaning": "Значение символа"}
  ],
  "analysis": "Подробный анализ (3-4 абзаца)",
  "advice": ["Совет 1", "Совет 2", "Совет 3"],
  "questions": ["Вопрос 1 для рефлексии", "Вопрос 2 для рефлексии"]
}`;
  }

  /**
   * Validate and normalize AI response
   * Ensures response matches AnalysisResponse interface
   */
  protected validateResponse(response: any): AnalysisResponse {
    // Handle string responses (parse as JSON)
    if (typeof response === 'string') {
      try {
        response = JSON.parse(response);
      } catch (e) {
        throw new Error('Invalid JSON response from AI');
      }
    }

    // Validate required fields
    if (!response.summary || typeof response.summary !== 'string') {
      throw new Error('Missing or invalid summary in AI response');
    }

    // Ensure symbolism is array
    if (!Array.isArray(response.symbolism)) {
      response.symbolism = [];
    }

    // Validate symbols
    response.symbolism = response.symbolism.map((symbol: any): DreamSymbol => {
      if (!symbol.name || !symbol.meaning) {
        throw new Error('Invalid symbol in AI response');
      }
      return {
        name: symbol.name,
        meaning: symbol.meaning
      };
    });

    // Ensure analysis is string
    if (!response.analysis || typeof response.analysis !== 'string') {
      response.analysis = response.summary; // Fallback to summary
    }

    // Ensure advice is array of strings
    if (!Array.isArray(response.advice)) {
      response.advice = [];
    }
    response.advice = response.advice.filter((item: any) => typeof item === 'string');

    // Ensure questions is array of strings
    if (!Array.isArray(response.questions)) {
      response.questions = [];
    }
    response.questions = response.questions.filter((item: any) => typeof item === 'string');

    return response as AnalysisResponse;
  }

  /**
   * Get model configuration (temperature, max_tokens, etc.)
   */
  protected getModelConfig() {
    return {
      temperature: this.config.config.temperature || 0.7,
      max_tokens: this.config.config.max_tokens || 4096,
      top_p: this.config.config.top_p || 1.0
    };
  }

  /**
   * Log provider activity (for debugging and monitoring)
   */
  protected log(message: string, data?: any) {
    console.log(`[${this.config.provider_name}] ${message}`, data || '');
  }

  /**
   * Log error with provider context
   */
  protected logError(message: string, error: any) {
    console.error(`[${this.config.provider_name}] ERROR: ${message}`, error);
  }
}
