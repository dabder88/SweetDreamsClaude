
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DreamData, PsychMethod, AnalysisResponse, DreamSymbol } from "../types";

// --- ROBUST API KEY FETCHING ---
const getApiKey = (): string => {
  // 1. Try Vite standard (import.meta.env.VITE_API_KEY)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  // 2. Try legacy/standard Node environment (safe access)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env.API_KEY || process.env.VITE_API_KEY;
    }
  } catch (e) {}

  return "";
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey: apiKey });

/**
 * Helper function to clean and parse JSON from AI response.
 * Includes logic to repair cut-off JSON strings.
 */
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
      // Return a valid empty object if repair fails entirely to prevent crash
      return {}; 
    }
  }
};

export const analyzeDream = async (data: DreamData): Promise<AnalysisResponse> => {
  const { description, context, method } = data;

  if (!apiKey) {
    console.error("CRITICAL: API Key is missing.");
    throw new Error("API ключ не найден. Проверьте настройки Vercel (VITE_API_KEY).");
  }

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
  // We ask for symbols ONLY by name here to save tokens for the deep analysis part.
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
      advice: { type: Type.ARRAY, items: { type: Type.STRING } }, // Changed to array
      questions: { type: Type.ARRAY, items: { type: Type.STRING } },
      symbol_names: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["summary", "analysis", "advice", "questions", "symbol_names"]
  };

  try {
    // --- EXECUTE STEP 1 ---
    const response1 = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
    // We split each symbol into its own request to guarantee length and avoid JSON cutoff
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
          const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: step2Prompt,
            config: {
              systemInstruction: "Ты — эксперт по символам. Пиши подробно, глубоко и много. Только русский язык.",
              responseMimeType: "application/json",
              responseSchema: step2Schema,
              temperature: 0.5,
              maxOutputTokens: 4000, // Plenty for one symbol
            }
          });
          return cleanAndParseJSON(response.text) as DreamSymbol;
        } catch (err) {
          console.error(`Failed to analyze symbol ${symbolName}`, err);
          return { name: symbolName, meaning: "Не удалось загрузить подробное толкование символа." };
        }
      });

      // Run all symbol analyses in parallel
      symbolismData = await Promise.all(symbolPromises);
    }

    return {
      summary: result1.summary,
      analysis: result1.analysis,
      advice: Array.isArray(result1.advice) ? result1.advice : [result1.advice || "Совет отсутствует."], // Safety check
      questions: result1.questions,
      symbolism: symbolismData
    };

  } catch (error) {
    console.error("Analysis failed", error);
    return {
        summary: "Анализ был прерван.",
        symbolism: [],
        analysis: "К сожалению, произошла ошибка при генерации отчета. Попробуйте сократить описание сна или повторить запрос чуть позже. \n\n**Важно:** Проверьте API ключ в настройках Vercel (VITE_API_KEY).",
        advice: ["Попробуйте снова."],
        questions: []
    };
  }
};

export const visualizeDream = async (description: string): Promise<string> => {
  try {
    if (!apiKey) throw new Error("API Key Missing (VITE_API_KEY)");

    const prompt = `A surreal, artistic, and dreamlike digital painting representation of this dream description (interpret the visuals artistically): "${description}". 
    Style: Ethereal, psychological, symbolic, soft lighting, deep atmosphere, high quality concept art, darker tones to match a midnight theme.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Изображение не сгенерировано");
  } catch (error) {
    console.error("Visualization failed", error);
    throw error;
  }
};
