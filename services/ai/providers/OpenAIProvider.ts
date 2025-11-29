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

    const apiKey = this.getApiKey() || 'dummy-key-for-init'; // Use dummy key if not found

    // Initialize OpenAI client with custom baseURL
    // This allows us to use the same client for OpenAI, AiTunnel, and NeuroAPI
    // API key validation will happen during actual API calls
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: config.base_url || 'https://api.openai.com/v1',
      dangerouslyAllowBrowser: true // Allow usage in browser (Vite client-side)
    });

    this.log(`Initialized with model ${model.model_id}`);
  }

  /**
   * Validate API key before making requests
   * Throws error if key is missing or invalid
   */
  private validateApiKey(): void {
    const apiKey = this.getApiKey();
    if (!apiKey || apiKey === 'dummy-key-for-init') {
      throw new Error(`API key not found for ${this.config.provider_name}. Please set ${this.config.api_key_env_name} in .env file`);
    }
  }

  /**
   * Analyze dream using OpenAI chat completion
   * Uses two-stage process like Gemini for detailed symbol analysis
   */
  async analyzeDream(dreamData: DreamData): Promise<AnalysisResponse> {
    try {
      // Validate API key before making any requests
      this.validateApiKey();

      this.log('Starting dream analysis (two-stage process)');

      // ===== STAGE 1: Main Analysis + Symbol Names =====
      const stage1Prompt = this.buildStage1Prompt(dreamData);
      const modelConfig = this.getModelConfig();

      const completion1 = await this.client.chat.completions.create({
        model: this.model.model_id,
        messages: [
          {
            role: 'system',
            content: 'Ты — эксперт-психолог с 20-летним стажем. Пиши структурированно, содержательно, с развернутыми объяснениями. Строго соблюдай JSON формат.'
          },
          {
            role: 'user',
            content: stage1Prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: modelConfig.temperature,
        max_tokens: Math.max(modelConfig.max_tokens, 8192),
        top_p: modelConfig.top_p
      });

      const responseText1 = completion1.choices[0]?.message?.content;
      if (!responseText1) {
        throw new Error('Empty response from AI (Stage 1)');
      }

      const stage1Result = this.parseJsonResponse(responseText1);
      this.log('Stage 1 completed - extracting symbol names');

      // ===== STAGE 2: Detailed Symbol Analysis (PARALLEL) =====
      const symbolNames: string[] = stage1Result.symbol_names || [];
      let symbolismData: any[] = [];

      if (symbolNames.length > 0) {
        this.log(`Stage 2: Analyzing ${symbolNames.length} symbols in parallel`);

        const symbolPromises = symbolNames.map(async (symbolName) => {
          const symbolPrompt = this.buildSymbolPrompt(symbolName, dreamData);

          try {
            const symbolCompletion = await this.client.chat.completions.create({
              model: this.model.model_id,
              messages: [
                {
                  role: 'system',
                  content: 'Ты — эксперт по символам сновидений. Пиши ПОДРОБНО, ГЛУБОКО и РАЗВЕРНУТО. Только русский язык. Строго соблюдай JSON формат.'
                },
                {
                  role: 'user',
                  content: symbolPrompt
                }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.5,
              max_tokens: 4000, // Отдельный лимит для символов
              top_p: modelConfig.top_p
            });

            const symbolText = symbolCompletion.choices[0]?.message?.content;
            if (symbolText) {
              return this.parseJsonResponse(symbolText);
            }
            return { name: symbolName, meaning: 'Не удалось загрузить подробное толкование символа.' };
          } catch (err) {
            this.logError(`Failed to analyze symbol: ${symbolName}`, err);
            return { name: symbolName, meaning: 'Не удалось загрузить подробное толкование символа.' };
          }
        });

        symbolismData = await Promise.all(symbolPromises);
        this.log(`Stage 2 completed - analyzed ${symbolismData.length} symbols`);
      }

      // ===== COMBINE RESULTS =====
      const finalResult = {
        summary: stage1Result.summary,
        analysis: stage1Result.analysis,
        symbolism: symbolismData,
        advice: stage1Result.advice,
        questions: stage1Result.questions
      };

      this.log('Two-stage analysis completed successfully');
      return this.validateResponse(finalResult);
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
   * Works with OpenAI, AiTunnel, and NeuroAPI (all use OpenAI-compatible API)
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      // Validate API key before making any requests
      this.validateApiKey();

      this.log('Starting image generation');

      // Check if model supports image generation
      if (!this.model.capabilities.image) {
        throw new Error(`Модель ${this.model.model_name} не поддерживает генерацию изображений`);
      }

      // Get model config for size and quality settings
      const modelConfig = this.model.model_config || {};
      const size = modelConfig.size || '1024x1024';
      const quality = modelConfig.quality;

      this.log(`Generating image with model: ${this.model.model_id}, size: ${size}${quality ? `, quality: ${quality}` : ''}`);

      // Build request parameters (only include quality if specified in model config)
      const baseParams: any = {
        model: this.model.model_id,
        prompt: prompt,
        n: 1,
        size: size
      };

      // Only add quality parameter for DALL-E models (OpenAI native)
      // Other providers (AiTunnel, NeuroAPI) may not support it
      if (quality && this.model.model_id.includes('dall-e')) {
        baseParams.quality = quality;
      }

      // All OpenAI-compatible APIs use the same images.generate endpoint
      // Try b64_json first (faster, no CORS issues), fall back to URL if needed
      let response;
      try {
        this.log('Attempting b64_json format');
        response = await this.client.images.generate({
          ...baseParams,
          response_format: 'b64_json'
        });

        // Check if we got base64 data
        const b64Json = response.data[0]?.b64_json;
        if (b64Json) {
          const base64Image = `data:image/png;base64,${b64Json}`;
          this.log('Image generated successfully (b64_json format)');
          return base64Image;
        }

        this.log('No b64_json in response, will try URL format');
      } catch (b64Error: any) {
        this.log(`b64_json format failed: ${b64Error.message}, trying URL format`);
      }

      // Fall back to URL format and download the image
      this.log('Requesting URL format');
      response = await this.client.images.generate({
        ...baseParams,
        response_format: 'url'
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      this.log(`Image URL received: ${imageUrl.substring(0, 100)}...`);

      // Check if the URL is already a base64 data URL
      if (imageUrl.startsWith('data:image/')) {
        this.log('Image is already in base64 format');
        return imageUrl;
      }

      // Download image from HTTP/HTTPS URL and convert to base64
      this.log('Downloading image from URL...');
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
      }

      const blob = await imageResponse.blob();
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      this.log('Image downloaded and converted to base64 successfully');
      return base64Image;
    } catch (error: any) {
      this.logError('Image generation failed', error);
      throw new Error(`Ошибка генерации изображения: ${error.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Build Stage 1 prompt: Main analysis + symbol names extraction
   * This is the first request that gets summary, analysis, advice, questions, and symbol names
   */
  private buildStage1Prompt(dreamData: DreamData): string {
    const { description, context, method } = dreamData;

    // Method-specific instructions
    const methodPrompts: Record<string, string> = {
      jungian: 'Используй аналитическую психологию Карла Юнга (архетипы, Тень, Анима/Анимус, коллективное бессознательное).',
      freudian: 'Используй психоанализ Фрейда (вытесненные желания, эдипов комплекс, скрытые конфликты, либидо).',
      gestalt: 'Используй принципы Гештальт-терапии (части личности, диалог с объектами сна, "здесь и сейчас").',
      cognitive: 'Используй когнитивно-эмпирическую модель (связь мыслей, установок и дневного опыта).',
      existential: 'Используй экзистенциальный подход (свобода, ответственность, поиск смысла, страх смерти).',
      auto: 'Выбери наиболее подходящую научную психологическую концепцию (Юнг, Фрейд, Гештальт или Экзистенциализм) и явно укажи, какой подход используешь.'
    };

    const methodPrompt = methodPrompts[method] || methodPrompts.auto;

    return `Ты — профессиональный психоаналитик с 20-летним стажем. Проведи ПЕРВЫЙ ЭТАП анализа сна.
Язык: РУССКИЙ.

ВХОДНЫЕ ДАННЫЕ:
- Сон: "${description.substring(0, 3000)}"
- Эмоция при пробуждении: ${context.emotion}
- Жизненная ситуация: ${context.lifeSituation}
- Ассоциации: ${context.associations}
- Повторяющийся сон: ${context.recurring ? 'Да' : 'Нет'}
- Дневной остаток: ${context.dayResidue}
- Типы персонажей: ${context.characterType}
- Роль во сне: ${context.dreamRole}
- Телесные ощущения: ${context.physicalSensation}

МЕТОД АНАЛИЗА: ${methodPrompt}

ЗАДАЧА:
1. Сформируй "summary" (краткая суть сна, 2-3 предложения).

2. Проведи "analysis" (ГЛУБОКИЙ И РАЗВЕРНУТЫЙ анализ):
   - ОБЯЗАТЕЛЬНО УЧТИ: роль сновидца (например, наблюдатель может указывать на диссоциацию) и телесные реакции (психосоматика)
   - Используй Markdown-форматирование с заголовками ### для структурирования
   - МИНИМУМ 4-5 СОДЕРЖАТЕЛЬНЫХ смысловых блоков
   - Каждый блок должен содержать 3-4 абзаца
   - Разделяй абзацы двойным переносом (\\n\\n)
   - Пиши развернуто и глубоко, избегай поверхностных формулировок

3. Дай "advice" (массив строк):
   - Сгенерируй от 3 до 5 РАЗВЕРНУТЫХ практических рекомендаций
   - КАЖДАЯ рекомендация должна быть МИНИМУМ 2-3 предложения
   - Рекомендации должны быть конкретными и применимыми
   - Каждая рекомендация - отдельный элемент массива

4. Дай "questions" (массив строк):
   - 3-4 глубоких вопроса для рефлексии
   - Вопросы должны помогать сновидцу глубже понять себя

5. Выдели "symbol_names" (массив строк):
   - Выдели 3-5 названий КЛЮЧЕВЫХ символов из сна
   - НЕ ПИШИ ИХ ЗНАЧЕНИЯ ЗДЕСЬ, только названия
   - Это будут символы для детального анализа на следующем этапе

ФОРМАТ ОТВЕТА (строго JSON):
{
  "summary": "Краткое резюме сна",
  "analysis": "Подробный анализ с использованием Markdown",
  "advice": [
    "Развернутая рекомендация 1 из нескольких предложений",
    "Развернутая рекомендация 2 из нескольких предложений"
  ],
  "questions": [
    "Глубокий вопрос 1",
    "Глубокий вопрос 2"
  ],
  "symbol_names": [
    "Символ 1",
    "Символ 2",
    "Символ 3"
  ]
}

ВАЖНО: Пиши СОДЕРЖАТЕЛЬНО и РАЗВЕРНУТО. Короткие ответы неприемлемы.`;
  }

  /**
   * Build Stage 2 prompt: Detailed analysis of a specific symbol
   * This creates individual requests for each symbol identified in Stage 1
   */
  private buildSymbolPrompt(symbolName: string, dreamData: DreamData): string {
    const { description, context } = dreamData;

    return `АНАЛИЗ СИМВОЛА: "${symbolName}"

ПОЛНЫЙ КОНТЕКСТ СНА: "${description}"
ЖИЗНЕННАЯ СИТУАЦИЯ: ${context.lifeSituation}
РОЛЬ ВО СНЕ: ${context.dreamRole}
ТЕЛЕСНЫЕ ОЩУЩЕНИЯ: ${context.physicalSensation}
ЭМОЦИЯ: ${context.emotion}

ЗАДАЧА:
Напиши МАКСИМАЛЬНО ПОДРОБНОЕ толкование символа "${symbolName}" в контексте этого сна и состояния человека.

ТРЕБОВАНИЯ:
1. ЯЗЫК: ТОЛЬКО РУССКИЙ
2. ОБЪЕМ: 3-4 развернутых абзаца (минимум 800 знаков)
3. ГЛУБИНА: Объясни психологическое значение, связь с жизненной ситуацией, возможные послания подсознания
4. ФОРМАТ: Строго JSON

ФОРМАТ ОТВЕТА:
{
  "name": "${symbolName}",
  "meaning": "Очень подробное толкование символа на 3-4 абзаца..."
}

ВАЖНО: Пиши МАКСИМАЛЬНО ПОДРОБНО И РАЗВЕРНУТО. Минимум 800 знаков в поле "meaning".`;
  }

  /**
   * Build detailed prompt with specific volume requirements
   * DEPRECATED: Replaced by two-stage process (buildStage1Prompt + buildSymbolPrompt)
   * Kept for reference
   */
  private buildDetailedPrompt(dreamData: DreamData): string {
    const { description, context, method } = dreamData;

    // Method-specific instructions
    const methodPrompts: Record<string, string> = {
      jungian: 'Используй аналитическую психологию Карла Юнга (архетипы, Тень, Анима/Анимус, коллективное бессознательное).',
      freudian: 'Используй психоанализ Фрейда (вытесненные желания, эдипов комплекс, скрытые конфликты, либидо).',
      gestalt: 'Используй принципы Гештальт-терапии (части личности, диалог с объектами сна, "здесь и сейчас").',
      cognitive: 'Используй когнитивно-эмпирическую модель (связь мыслей, установок и дневного опыта).',
      existential: 'Используй экзистенциальный подход (свобода, ответственность, поиск смысла, страх смерти).',
      auto: 'Выберите наиболее подходящую научную психологическую концепцию (Юнг, Фрейд, Гештальт или Экзистенциализм) и явно укажи, какой подход используешь.'
    };

    const methodPrompt = methodPrompts[method] || methodPrompts.auto;

    return `Ты — профессиональный психоаналитик с 20-летним стажем. Проведи ГЛУБОКИЙ И РАЗВЕРНУТЫЙ анализ сна.
Язык: РУССКИЙ.

ВХОДНЫЕ ДАННЫЕ:
- Сон: "${description.substring(0, 3000)}"
- Эмоция при пробуждении: ${context.emotion}
- Жизненная ситуация: ${context.lifeSituation}
- Ассоциации: ${context.associations}
- Повторяющийся сон: ${context.recurring ? 'Да' : 'Нет'}
- Дневной остаток: ${context.dayResidue}
- Типы персонажей: ${context.characterType}
- Роль во сне: ${context.dreamRole}
- Телесные ощущения: ${context.physicalSensation}

МЕТОД АНАЛИЗА: ${methodPrompt}

ЗАДАЧА:
1. Сформируй "summary" (краткая суть сна, 2-3 предложения).

2. Проведи "analysis" (ГЛУБОКИЙ И РАЗВЕРНУТЫЙ анализ):
   - ОБЯЗАТЕЛЬНО УЧТИ: роль сновидца (например, наблюдатель может указывать на диссоциацию) и телесные реакции (психосоматика)
   - Используй Markdown-форматирование с заголовками ### для структурирования
   - МИНИМУМ 4-5 СОДЕРЖАТЕЛЬНЫХ смысловых блоков
   - Каждый блок должен содержать 3-4 абзаца
   - Разделяй абзацы двойным переносом (\\n\\n)
   - Пиши развернуто и глубоко, избегай поверхностных формулировок

3. Сформируй "symbolism" (массив объектов с символами):
   - Выдели 3-5 ключевых символов из сна
   - Для каждого символа создай объект: {"name": "Название символа", "meaning": "Подробное объяснение значения символа в контексте этого сна"}
   - Каждое "meaning" должно быть РАЗВЕРНУТЫМ (минимум 3-4 предложения)

4. Дай "advice" (массив строк):
   - Сгенерируй от 3 до 5 РАЗВЕРНУТЫХ практических рекомендаций
   - КАЖДАЯ рекомендация должна быть МИНИМУМ 2-3 предложения
   - Рекомендации должны быть конкретными и применимыми
   - Каждая рекомендация - отдельный элемент массива

5. Дай "questions" (массив строк):
   - 3-4 глубоких вопроса для рефлексии
   - Вопросы должны помогать сновидцу глубже понять себя

ФОРМАТ ОТВЕТА (строго JSON):
{
  "summary": "Краткое резюме сна",
  "analysis": "Подробный анализ с использованием Markdown",
  "symbolism": [
    {"name": "Символ 1", "meaning": "Развернутое значение символа 1"},
    {"name": "Символ 2", "meaning": "Развернутое значение символа 2"}
  ],
  "advice": [
    "Развернутая рекомендация 1 из нескольких предложений",
    "Развернутая рекомендация 2 из нескольких предложений"
  ],
  "questions": [
    "Глубокий вопрос 1",
    "Глубокий вопрос 2"
  ]
}

ВАЖНО: Пиши СОДЕРЖАТЕЛЬНО и РАЗВЕРНУТО. Короткие ответы неприемлемы.`;
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
