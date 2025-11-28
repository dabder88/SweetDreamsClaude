/**
 * OpenAIProvider - Universal provider for OpenAI-compatible APIs
 *
 * This provider works with:
 * - OpenAI Direct (https://api.openai.com/v1)
 * - AiTunnel (https://api.aitunnel.ru/v1)
 * - NeuroAPI (https://neuroapi.host/v1)
 *
 * All three use OpenAI-compatible API, so we just change the baseURL!
 */

import OpenAI from 'openai';
import { BaseProvider } from './BaseProvider';
import type { DreamData, AnalysisResponse, AIProviderConfig, AIModel } from '../../../types';

export class OpenAIProvider extends BaseProvider {
  private client: OpenAI;

  constructor(config: AIProviderConfig, model: AIModel) {
    super(config, model);

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(`API key not found for ${config.provider_name}. Please set ${config.api_key_env_name} in .env file`);
    }

    // Initialize OpenAI client with custom baseURL
    // This allows us to use the same client for OpenAI, AiTunnel, and NeuroAPI
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: config.base_url || 'https://api.openai.com/v1',
      dangerouslyAllowBrowser: true // Allow usage in browser (Vite client-side)
    });

    this.log(`Initialized with model ${model.model_id}`);
  }

  /**
   * Analyze dream using OpenAI chat completion
   */
  async analyzeDream(dreamData: DreamData): Promise<AnalysisResponse> {
    try {
      this.log('Starting dream analysis');

      const prompt = this.buildPrompt(dreamData);
      const modelConfig = this.getModelConfig();

      // Call OpenAI API (or AiTunnel/NeuroAPI with same interface)
      const completion = await this.client.chat.completions.create({
        model: this.model.model_id,
        messages: [
          {
            role: 'system',
            content: 'Ты - профессиональный психолог-аналитик снов. Твоя задача - предоставить глубокий, проницательный анализ снов в формате JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }, // Request JSON response
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens,
        top_p: modelConfig.top_p
      });

      // Extract response text
      const responseText = completion.choices[0]?.message?.content;
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
   * Note: Not all OpenAI-compatible APIs support image generation
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      this.log('Starting image generation');

      // Check if model supports image generation
      if (!this.model.capabilities.image) {
        throw new Error(`Модель ${this.model.model_name} не поддерживает генерацию изображений`);
      }

      // For OpenAI Direct, use DALL-E
      if (this.config.provider_type === 'openai') {
        const response = await this.client.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard'
        });

        const imageUrl = response.data[0]?.url;
        if (!imageUrl) {
          throw new Error('No image URL in response');
        }

        // Convert URL to base64 (download image)
        const base64Image = await this.urlToBase64(imageUrl);
        this.log('Image generated successfully');
        return base64Image;
      }

      // For AiTunnel/NeuroAPI, image generation may use different endpoints
      // This is a placeholder - implement based on specific provider capabilities
      throw new Error(`Генерация изображений не поддерживается для ${this.config.provider_name}`);
    } catch (error: any) {
      this.logError('Image generation failed', error);
      throw new Error(`Ошибка генерации изображения: ${error.message || 'Неизвестная ошибка'}`);
    }
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

  /**
   * Convert image URL to base64 data URL
   */
  private async urlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('Failed to download image');
    }
  }
}
