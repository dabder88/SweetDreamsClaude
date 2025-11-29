/**
 * GeminiProvider - Adapter for Google Gemini AI
 *
 * Implements two-stage dream analysis:
 * 1. Stage 1: Get summary, analysis, advice, questions, and symbol names
 * 2. Stage 2: Parallel requests for detailed symbol meanings
 *
 * Uses structured output (JSON schema) for reliable parsing
 */

import { GoogleGenAI, Type, Schema } from '@google/genai';
import { BaseProvider } from './BaseProvider';
import type { DreamData, AnalysisResponse, DreamSymbol, AIProviderConfig, AIModel, PsychMethod } from '../../../types';

export class GeminiProvider extends BaseProvider {
  private ai: GoogleGenAI;

  constructor(config: AIProviderConfig, model: AIModel) {
    super(config, model);

    const apiKey = this.getApiKey() || 'dummy-key-for-init'; // Use dummy key if not found

    // API key validation will happen during actual API calls
    this.ai = new GoogleGenAI({ apiKey });
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
   * Two-stage dream analysis
   */
  async analyzeDream(dreamData: DreamData): Promise<AnalysisResponse> {
    try {
      // Validate API key before making any requests
      this.validateApiKey();

      this.log('Starting two-stage dream analysis');

      // Stage 1: Get main analysis + symbol names
      const stage1Result = await this.executeStage1(dreamData);

      // Stage 2: Get detailed symbol meanings (parallel requests)
      const symbolism = await this.executeStage2(stage1Result.symbol_names, dreamData);

      this.log('Analysis completed successfully');

      return {
        summary: stage1Result.summary,
        analysis: stage1Result.analysis,
        advice: Array.isArray(stage1Result.advice) ? stage1Result.advice : [stage1Result.advice || 'Совет отсутствует.'],
        questions: stage1Result.questions,
        symbolism: symbolism
      };
    } catch (error: any) {
      this.logError('Dream analysis failed', error);
      throw new Error(`Ошибка анализа: ${error.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Stage 1: Get summary, analysis, advice, questions, and symbol names
   */
  private async executeStage1(dreamData: DreamData) {
    const { description, context, method } = dreamData;

    // Method-specific prompt
    const methodPrompt = this.getMethodPrompt(method);

    const prompt = `
      Ты — профессиональный психоаналитик с 20-летним стажем. Проведи ПЕРВЫЙ ЭТАП анализа сна.
      Язык: РУССКИЙ.

      ВХОДНЫЕ ДАННЫЕ:
      - Сон: "${description.substring(0, 3000)}"
      - Эмоция: ${context.emotion}
      - Жизнь: ${context.lifeSituation}
      - Ассоциации: ${context.associations}
      - Дневной остаток: ${context.dayResidue}
      - Персонажи: ${context.characterType}
      - Роль во сне: ${context.dreamRole}
      - Телесные ощущения: ${context.physicalSensation}
      - Метод: ${methodPrompt}

      ЗАДАЧА:
      1. Сформируй "summary" (краткая суть).
      2. Проведи "analysis" (ГЛУБОКИЙ анализ всей ситуации).
         - ОБЯЗАТЕЛЬНО УЧТИ: роль сновидца (например, наблюдатель может указывать на диссоциацию) и телесные реакции (психосоматика).
         - Используй Markdown (заголовки ###).
         - 4-5 смысловых блоков.
         - Разделяй абзацы двойным переносом (\\n\\n).
      3. Дай "advice" (массив строк): Сгенерируй от 3 до 5 развернутых практических рекомендаций (минимум 2-3 предложения каждая). Каждая рекомендация - отдельный элемент массива.
      4. Дай "questions" (массив строк): 3 глубоких вопроса для рефлексии.
      5. Выдели "symbol_names": массив из 3-5 названий ключевых символов. НЕ ПИШИ ИХ ЗНАЧЕНИЯ ЗДЕСЬ, только названия.

      ФОРМАТ ОТВЕТА: JSON.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        analysis: { type: Type.STRING },
        advice: { type: Type.ARRAY, items: { type: Type.STRING } },
        questions: { type: Type.ARRAY, items: { type: Type.STRING } },
        symbol_names: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['summary', 'analysis', 'advice', 'questions', 'symbol_names']
    };

    const response = await this.ai.models.generateContent({
      model: this.model.model_id,
      contents: prompt,
      config: {
        systemInstruction: 'Ты — эксперт-психолог. Пиши структурированно, без воды. Строго соблюдай JSON формат.',
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: this.getModelConfig().temperature,
        maxOutputTokens: 8192
      }
    });

    return this.cleanAndParseJSON(response.text);
  }

  /**
   * Stage 2: Get detailed meanings for each symbol (parallel requests)
   */
  private async executeStage2(symbolNames: string[], dreamData: DreamData): Promise<DreamSymbol[]> {
    if (!symbolNames || symbolNames.length === 0) {
      return [];
    }

    const { description, context } = dreamData;

    const symbolPromises = symbolNames.map(async (symbolName) => {
      const prompt = `
        АНАЛИЗ СИМВОЛА: "${symbolName}"

        ПОЛНЫЙ КОНТЕКСТ СНА: "${description}"
        ЖИЗНЕННАЯ СИТУАЦИЯ: ${context.lifeSituation}
        РОЛЬ ВО СНЕ: ${context.dreamRole}
        ТЕЛЕСНЫЕ ОЩУЩЕНИЯ: ${context.physicalSensation}
        ЭМОЦИЯ: ${context.emotion}

        ЗАДАЧА:
        Напиши МАКСИМАЛЬНО ПОДРОБНОЕ толкование символа "${symbolName}" в контексте этого сна и состояния человека.

        ТРЕБОВАНИЯ:
        1. ЯЗЫК: ТОЛЬКО РУССКИЙ.
        2. ОБЪЕМ: 3-4 развернутых абзаца (минимум 800 знаков).
        3. ФОРМАТ: JSON { "name": "${symbolName}", "meaning": "текст..." }
      `;

      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          meaning: { type: Type.STRING }
        },
        required: ['name', 'meaning']
      };

      try {
        const response = await this.ai.models.generateContent({
          model: this.model.model_id,
          contents: prompt,
          config: {
            systemInstruction: 'Ты — эксперт по символам. Пиши подробно, глубоко и много. Только русский язык.',
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.5,
            maxOutputTokens: 4000
          }
        });

        return this.cleanAndParseJSON(response.text) as DreamSymbol;
      } catch (err) {
        this.logError(`Failed to analyze symbol ${symbolName}`, err);
        return { name: symbolName, meaning: 'Не удалось загрузить подробное толкование символа.' };
      }
    });

    return await Promise.all(symbolPromises);
  }

  /**
   * Generate dream visualization image
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      // Validate API key before making any requests
      this.validateApiKey();

      this.log('Starting image generation');

      const enhancedPrompt = `Generate a surreal, artistic, and dreamlike digital painting: "${prompt}".
Style: Ethereal, psychological, symbolic, soft lighting, deep atmosphere, high quality concept art, darker tones to match a midnight theme.`;

      // Use gemini-2.0-flash-exp for image generation via generateContent
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: enhancedPrompt
      });

      // Iterate through parts to find the inline image data
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            this.log('Image generated successfully');
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }

      throw new Error('Изображение не сгенерировано (нет данных в ответе)');
    } catch (error: any) {
      this.logError('Image generation failed', error);
      throw new Error(`Ошибка генерации изображения: ${error.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Get method-specific prompt
   */
  private getMethodPrompt(method: PsychMethod): string {
    const prompts: Record<PsychMethod, string> = {
      jungian: 'Используй аналитическую психологию Карла Юнга (архетипы, Тень, Анима/Анимус, коллективное бессознательное).',
      freudian: 'Используй психоанализ Фрейда (вытесненные желания, эдипов комплекс, скрытые конфликты, либидо).',
      gestalt: 'Используй принципы Гештальт-терапии (части личности, диалог с объектами сна, \'здесь и сейчас\').',
      cognitive: 'Используй когнитивно-эмпирическую модель (связь мыслей, установок и дневного опыта).',
      existential: 'Используй экзистенциальный подход (свобода, ответственность, поиск смысла, страх смерти).',
      auto: 'Выберите наиболее подходящую научную психологическую концепцию (Юнг, Фрейд, Гештальт или Экзистенциализм) и явно укажи, какой подход используешь.'
    };

    return prompts[method] || prompts.auto;
  }

  /**
   * Clean and parse JSON response with error recovery
   */
  private cleanAndParseJSON(text: string): any {
    let jsonString = text || '{}';

    // 1. Clean Markdown wrappers
    jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    jsonString = jsonString.trim();

    // 2. Attempt parsing
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      this.log('Initial JSON parse failed, attempting repair');

      // 3. Smart repair logic for cutoff JSON
      let repaired = jsonString;

      // Fix unclosed strings
      const quoteCount = (repaired.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        if (repaired.endsWith('\\')) repaired = repaired.slice(0, -1);
        repaired += '"';
      }

      // Fix unclosed brackets/braces
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;

      if (openBrackets > closeBrackets) {
        repaired += ']'.repeat(openBrackets - closeBrackets);
      }
      if (openBraces > closeBraces) {
        repaired += '}'.repeat(openBraces - closeBraces);
      }

      try {
        return JSON.parse(repaired);
      } catch (e2) {
        this.logError('JSON repair failed', e2);
        return {};
      }
    }
  }
}
