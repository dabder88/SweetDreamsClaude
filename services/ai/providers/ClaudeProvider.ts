/**
 * ClaudeProvider - Adapter for Anthropic Claude AI
 *
 * Implements dream analysis using Claude's chat completion API
 * Uses structured prompts to ensure consistent JSON output
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './BaseProvider';
import type { DreamData, AnalysisResponse, AIProviderConfig, AIModel } from '../../../types';

export class ClaudeProvider extends BaseProvider {
  private client: Anthropic;

  constructor(config: AIProviderConfig, model: AIModel) {
    super(config, model);

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(`API key not found for ${config.provider_name}. Please set ${config.api_key_env_name} in .env file`);
    }

    this.client = new Anthropic({
      apiKey: apiKey
    });

    this.log(`Initialized with model ${model.model_id}`);
  }

  /**
   * Analyze dream using Claude chat completion
   */
  async analyzeDream(dreamData: DreamData): Promise<AnalysisResponse> {
    try {
      this.log('Starting dream analysis');

      const prompt = this.buildPrompt(dreamData);
      const modelConfig = this.getModelConfig();

      // Call Claude API
      const message = await this.client.messages.create({
        model: this.model.model_id,
        max_tokens: modelConfig.max_tokens,
        temperature: modelConfig.temperature,
        system: 'Ты - профессиональный психолог-аналитик снов. Твоя задача - предоставить глубокий, проницательный анализ снов в формате JSON. Всегда отвечай строго в формате JSON без дополнительного текста.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Extract response text
      const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
      if (!responseText) {
        throw new Error('Empty response from AI');
      }

      this.log('Analysis completed successfully');

      // Parse and validate JSON response
      const parsedResponse = this.parseJsonResponse(responseText);
      return this.validateResponse(parsedResponse);
    } catch (error: any) {
      this.logError('Dream analysis failed', error);

      // Provide user-friendly error messages
      if (error.status === 401) {
        throw new Error(`Ошибка аутентификации: Проверьте API ключ для ${this.config.provider_name}`);
      } else if (error.status === 429) {
        throw new Error('Превышен лимит запросов. Пожалуйста, подождите немного.');
      } else if (error.status === 500 || error.status === 503) {
        throw new Error(`Сервер ${this.config.provider_name} временно недоступен. Попробуйте позже.`);
      } else {
        throw new Error(`Ошибка анализа: ${error.message || 'Неизвестная ошибка'}`);
      }
    }
  }

  /**
   * Generate dream visualization image
   * Note: Claude does not support image generation
   */
  async generateImage(prompt: string): Promise<string> {
    throw new Error(`Claude не поддерживает генерацию изображений. Используйте другой провайдер (Gemini, DALL-E).`);
  }

  /**
   * Parse JSON response with error recovery
   * Handles incomplete or malformed JSON from AI
   */
  private parseJsonResponse(text: string): any {
    try {
      return JSON.parse(text);
    } catch (e) {
      // Try to repair common JSON errors (unclosed quotes, brackets)
      this.log('JSON parse failed, attempting repair');

      // Remove markdown code blocks if present
      let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      // Try parsing cleaned text
      try {
        return JSON.parse(cleaned);
      } catch (e2) {
        // If still fails, try to extract JSON object
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (e3) {
            // Give up
            throw new Error('Unable to parse AI response as JSON');
          }
        }
        throw new Error('Unable to parse AI response as JSON');
      }
    }
  }
}
