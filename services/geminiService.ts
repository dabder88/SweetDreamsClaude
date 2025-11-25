
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DreamData, PsychMethod, AnalysisResponse, DreamSymbol } from "../types";

// --- ROBUST API KEY FETCHING ---
// Safe accessor that won't crash Vite or Node if env vars are missing
const getApiKey = (): string => {
  // 1. Try Vite standard (import.meta.env.VITE_API_KEY)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  // 2. Try legacy/standard Node environment (safe access)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process?.env) {
      // @ts-ignore
      return process.env.API_KEY || process.env.VITE_API_KEY;
    }
  } catch (e) {}

  return "";
};

// Helper function to clean and parse JSON from AI response.
const cleanAndParseJSON = (text: string): any => {
  let jsonString = text || "{}";
  
  // 1. Clean Markdown wrappers
  jsonString = jsonString.replace(/```json\s*/g, "").replace(/```\s*$/g, "");
  jsonString = jsonString.trim();

  // 2. Attempt Parsing
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn("Initial JSON parse failed, attempting repair...", e);
    
    // 3. Smart Repair Logic for Cutoff JSON
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
      console.error("Repair failed", e2);
      return {}; 
    }
  }
};

export const analyzeDream = async (data: DreamData): Promise<AnalysisResponse> => {
  const apiKey = getApiKey();
  
  // CRITICAL FIX: Check key inside the function, not at module level
  if (!apiKey) {
    console.error("CRITICAL: API Key is missing.");
    throw new Error("API Key is missing! Check Vercel Environment Variables (VITE_API_KEY).");
  }

  // Initialize AI only when needed
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const { description, context, method } = data;

  // --- Prepare Method Context ---
  let methodPrompt = "";
  switch (method) {
    case PsychMethod.JUNGIAN:
      methodPrompt = "Используй аналитическую психологию Карла Юнга (архетипы, Тень, Анима/Анимус, коллективное бессознательное).";
      break;
    case PsychMethod.FREUDIAN:
      methodPrompt = "Используй психоанализ Фрейда (вытесненные желания, эдипов комплекс, скрытые конфликты, либидо).";
      break;
    case PsychMethod.GESTALT:
      methodPrompt = "Используй принципы Гештальт-терапии (части личности, диалог с объектами сна, 'здесь и сейчас').";
      break;
    case PsychMethod.COGNITIVE:
      methodPrompt = "Используй когнитивно-эмпирическую модель (связь мыслей, установок и дневного опыта).";
      break;
    case PsychMethod.EXISTENTIAL:
      methodPrompt = "Используй экзистенциальный подход (свобода, ответственность, поиск смысла, страх смерти).";
      break;
    case PsychMethod.AUTO:
    default:
      methodPrompt = "Выберите наиболее подходящую научную психологическую концепцию (Юнг, Фрейд, Гештальт или Экзистенциализм) и явно укажи, какой подход используешь.";
      break;
  }

  const baseSystemInstruction = "Ты — эксперт-психолог. Пиши структурированно, без воды. Строго соблюдай JSON формат.";

  // --- STEP 1: Structure & Deep Analysis ---
  const step1Prompt = `
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

  const step1Schema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      analysis: { type: Type.STRING },
      advice: { type: Type.ARRAY, items: { type: Type.STRING } },
      questions: { type: Type.ARRAY, items: { type: Type.STRING } },
      symbol_names: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["summary", "analysis", "advice", "questions", "symbol_names"]
  };

  try {
    // --- EXECUTE STEP 1 ---
    // Changed model from 'gemini-3-pro-preview' to 'gemini-2.5-flash' to avoid Rate Limits (429) on free tier
    const response1 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: step1Prompt,
      config: {
        systemInstruction: baseSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: step1Schema,
        temperature: 0.4,
        maxOutputTokens: 8192,
      }
    });

    const result1 = cleanAndParseJSON(response1.text);
    const symbolNames: string[] = result1.symbol_names || [];

    // --- STEP 2: Detailed Symbolism (PARALLEL REQUESTS) ---
    let symbolismData: DreamSymbol[] = [];

    if (symbolNames.length > 0) {
      const symbolPromises = symbolNames.map(async (symbolName) => {
        const step2Prompt = `
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

        const step2Schema: Schema = {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            meaning: { type: Type.STRING }
          },
          required: ["name", "meaning"]
        };

        try {
          // Initialize new AI instance per request if needed, or reuse
          // Changed model from 'gemini-3-pro-preview' to 'gemini-2.5-flash' to avoid Rate Limits (429) on free tier
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: step2Prompt,
            config: {
              systemInstruction: "Ты — эксперт по символам. Пиши подробно, глубоко и много. Только русский язык.",
              responseMimeType: "application/json",
              responseSchema: step2Schema,
              temperature: 0.5,
              maxOutputTokens: 4000,
            }
          });
          return cleanAndParseJSON(response.text) as DreamSymbol;
        } catch (err) {
          console.error(`Failed to analyze symbol ${symbolName}`, err);
          return { name: symbolName, meaning: "Не удалось загрузить подробное толкование символа." };
        }
      });

      symbolismData = await Promise.all(symbolPromises);
    }

    return {
      summary: result1.summary,
      analysis: result1.analysis,
      advice: Array.isArray(result1.advice) ? result1.advice : [result1.advice || "Совет отсутствует."],
      questions: result1.questions,
      symbolism: symbolismData
    };

  } catch (error) {
    console.error("Analysis failed", error);
    throw error; // Re-throw to be caught by the UI
  }
};

export const visualizeDream = async (description: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing! Check Vercel Environment Variables (VITE_API_KEY).");

  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const prompt = `Generate a surreal, artistic, and dreamlike digital painting: "${description}".
    Style: Ethereal, psychological, symbolic, soft lighting, deep atmosphere, high quality concept art, darker tones to match a midnight theme.`;

    // Switch to gemini-2.0-flash-exp for image generation via generateContent
    // This avoids the 404 error from imagen-3.0-generate-001 which is often restricted
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    // Iterate through parts to find the inline image data
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("Изображение не сгенерировано (нет данных в ответе)");
  } catch (error) {
    console.error("Visualization failed", error);
    throw error;
  }
};

/**
 * Analyze archetypes present in a dream
 * Returns archetype scores (0-100) for each of the 12 Jungian archetypes
 */
export interface ArchetypeScores {
  hero: number;
  sage: number;
  explorer: number;
  rebel: number;
  creator: number;
  ruler: number;
  magician: number;
  lover: number;
  caregiver: number;
  jester: number;
  everyman: number;
  innocent: number;
}

export const analyzeArchetypes = async (dreamDescription: string, dreamContext: string): Promise<ArchetypeScores> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("API Key missing for archetype analysis");
    throw new Error("API Key is missing!");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `Проанализируй сновидение и определи интенсивность присутствия каждого из 12 юнгианских архетипов.

ОПИСАНИЕ СНА:
${dreamDescription}

КОНТЕКСТ:
${dreamContext}

12 ЮНГИАНСКИХ АРХЕТИПОВ:
1. Герой (Hero) - смелость, преодоление препятствий, битвы
2. Мудрец (Sage) - знание, поиск истины, учителя
3. Искатель (Explorer) - путешествия, поиск нового, свобода
4. Бунтарь (Rebel) - революция, разрушение старого, освобождение
5. Творец (Creator) - создание, искусство, самовыражение
6. Правитель (Ruler) - власть, контроль, лидерство
7. Маг (Magician) - трансформация, магия, видение невидимого
8. Любовник (Lover) - страсть, близость, красота, эмоции
9. Заботливый (Caregiver) - забота, защита, исцеление
10. Шут (Jester) - игра, смех, спонтанность, радость
11. Обыватель (Everyman) - принадлежность, простота, равенство
12. Невинный (Innocent) - чистота, оптимизм, детство, вера

ЗАДАЧА:
Оцени силу проявления каждого архетипа по шкале 0-100, где:
- 0 = архетип полностью отсутствует
- 25 = слабое присутствие (намёки, косвенные признаки)
- 50 = умеренное присутствие (явные признаки)
- 75 = сильное присутствие (доминирующая тема)
- 100 = очень сильное присутствие (центральная тема сна)

Верни ТОЛЬКО JSON в формате:
{
  "hero": <число 0-100>,
  "sage": <число 0-100>,
  "explorer": <число 0-100>,
  "rebel": <число 0-100>,
  "creator": <число 0-100>,
  "ruler": <число 0-100>,
  "magician": <число 0-100>,
  "lover": <число 0-100>,
  "caregiver": <число 0-100>,
  "jester": <число 0-100>,
  "everyman": <число 0-100>,
  "innocent": <число 0-100>
}`;

  try {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        hero: { type: Type.NUMBER },
        sage: { type: Type.NUMBER },
        explorer: { type: Type.NUMBER },
        rebel: { type: Type.NUMBER },
        creator: { type: Type.NUMBER },
        ruler: { type: Type.NUMBER },
        magician: { type: Type.NUMBER },
        lover: { type: Type.NUMBER },
        caregiver: { type: Type.NUMBER },
        jester: { type: Type.NUMBER },
        everyman: { type: Type.NUMBER },
        innocent: { type: Type.NUMBER }
      },
      required: ["hero", "sage", "explorer", "rebel", "creator", "ruler", "magician", "lover", "caregiver", "jester", "everyman", "innocent"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Ты — эксперт по юнгианским архетипам в снах. Анализируй глубоко и точно. Только русский язык.",
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3,
        maxOutputTokens: 500,
      }
    });

    console.log('🔵 [ArchetypeAnalysis] Full response object:', response);
    console.log('🔵 [ArchetypeAnalysis] response.text:', response.text);
    console.log('🔵 [ArchetypeAnalysis] response.candidates:', response.candidates);

    // Try to get text from response
    let responseText = '';
    if (response.text) {
      responseText = response.text;
    } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
      responseText = response.candidates[0].content.parts[0].text;
      console.log('🔵 [ArchetypeAnalysis] Extracted text from candidates:', responseText);
    } else {
      console.error('❌ [ArchetypeAnalysis] Cannot extract text from response');
      throw new Error('No text in API response');
    }

    const result = cleanAndParseJSON(responseText) as ArchetypeScores;
    console.log('✅ [ArchetypeAnalysis] Parsed scores:', result);
    return result;
  } catch (error) {
    console.error("Archetype analysis failed", error);
    throw error;
  }
};
