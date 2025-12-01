# AI PROVIDERS - Система AI провайдеров

> **Summary:** PsyDream использует универсальную систему AI провайдеров, позволяющую подключать любые AI модели (Gemini, OpenAI, Claude, AiTunnel, NeuroAPI и другие) для анализа снов и генерации изображений. Администраторы могут выбирать отдельные провайдеры для текстовых задач (анализ снов) и генерации изображений.

---

## ⚠️ ВАЖНО: Обновление документации

После изменений в системе AI провайдеров **ОБЯЗАТЕЛЬНО** обновляй этот файл и [CLAUDE.md](../CLAUDE.md).

**Что требует обновления:**
- Добавление новых провайдеров (новый класс в `/services/ai/providers/`)
- Изменения в AIService или AIProviderFactory
- Изменения в таблицах `ai_provider_configs` или `ai_models`
- Изменения в логике выбора провайдеров для text/image задач
- Добавление новых capabilities для моделей

---

## 📋 Архитектура системы

### Принцип работы

PsyDream НЕ зависит от конкретного AI провайдера (Gemini, OpenAI, Claude, etc.). Система построена на паттерне **Factory + Strategy**, позволяющем динамически выбирать провайдера из БД и использовать его через единый интерфейс.

**Ключевая особенность:** Администраторы могут назначить **разных провайдеров** для:
- **Text tasks** (анализ снов, отчёты) - например, Claude Sonnet
- **Image tasks** (генерация изображений) - например, DALL-E 3

---

## 🏗️ Компоненты системы

### 1. AIService (Singleton) - [services/ai/aiService.ts](../services/ai/aiService.ts)

**Главный сервис** для работы с AI. Все запросы идут через него.

```typescript
import { aiService } from './services/ai/aiService';

// Анализ сна (использует провайдера для текста)
const analysis = await aiService.analyzeDream(dreamData);

// Генерация изображения (использует провайдера для изображений)
const imageUrl = await aiService.generateImage(prompt);
```

**Как работает:**

1. **Загрузка активного провайдера:**
   - При вызове `analyzeDream()` или `generateImage()` AIService проверяет, какой провайдер активен для этого типа задачи
   - Запрашивает из БД таблицу `ai_provider_configs` по полям:
     - `is_active_for_text = true` - для текстовых задач
     - `is_active_for_images = true` - для генерации изображений
   - Загружает модель по умолчанию:
     - `default_model_id_for_text` - для текста
     - `default_model_id_for_images` - для изображений

2. **Кэширование:**
   - Провайдеры кэшируются на **1 минуту** (отдельно для text и image)
   - Это минимизирует запросы к БД
   - Кэш можно сбросить через `aiService.clearCache()`

3. **Создание экземпляра:**
   - Передаёт конфигурацию в AIProviderFactory
   - Factory создаёт нужный провайдер (GeminiProvider, OpenAIProvider, ClaudeProvider)
   - Провайдер готов к работе

**Основные методы:**

| Метод | Описание |
|-------|----------|
| `analyzeDream(dreamData)` | Анализ сна через активного text-провайдера |
| `generateImage(prompt)` | Генерация изображения через активного image-провайдера |
| `getActiveProviderInfo(taskType)` | Получить информацию о текущем провайдере |
| `clearCache(taskType?)` | Сбросить кэш провайдеров |
| `testConnection(taskType)` | Тест подключения к провайдеру |

---

### 2. AIProviderFactory - [services/ai/AIProviderFactory.ts](../services/ai/AIProviderFactory.ts)

**Фабрика** для создания экземпляров провайдеров на основе `provider_type`.

```typescript
const provider = AIProviderFactory.create(config, model);
```

**Маппинг провайдеров:**

| provider_type | Класс провайдера | Примечание |
|---------------|------------------|------------|
| `gemini` | GeminiProvider | Google Gemini AI |
| `openai` | OpenAIProvider | OpenAI API |
| `aitunnel` | OpenAIProvider | OpenAI-compatible API (AiTunnel) |
| `neuroapi` | OpenAIProvider | OpenAI-compatible API (NeuroAPI) |
| `claude` | ClaudeProvider | Anthropic Claude |
| `custom` | OpenAIProvider | Пользовательский провайдер (по умолчанию OpenAI-compatible) |

**Ключевой инсайт:** `openai`, `aitunnel`, `neuroapi` используют **один класс** OpenAIProvider, но с разными `base_url`:
- OpenAI: `https://api.openai.com/v1`
- AiTunnel: `https://api.aitunnel.ru/v1`
- NeuroAPI: `https://neuroapi.host/v1`

---

### 3. BaseProvider (Abstract) - [services/ai/providers/BaseProvider.ts](../services/ai/providers/BaseProvider.ts)

**Базовый класс** для всех провайдеров. Предоставляет общие методы:

```typescript
export abstract class BaseProvider {
  // Обязательные методы (реализуются в подклассах)
  abstract analyzeDream(dreamData: DreamData): Promise<AnalysisResponse>;
  abstract generateImage(prompt: string): Promise<string>;

  // Общие утилиты
  protected getApiKey(): string { ... }
  protected buildPrompt(dreamData: DreamData): string { ... }
  protected validateResponse(response: any): AnalysisResponse { ... }
  protected getModelConfig() { ... }
}
```

**Общие утилиты:**

| Метод | Описание |
|-------|----------|
| `getApiKey()` | Получает API ключ из переменной окружения (config.api_key_env_name) |
| `buildPrompt()` | Генерирует промпт для анализа сна на основе метода (jungian, freudian, etc.) |
| `validateResponse()` | Валидирует ответ AI и приводит к `AnalysisResponse` формату |
| `getModelConfig()` | Возвращает параметры модели (temperature, max_tokens, top_p) из model.model_config или provider.config |

---

### 4. Конкретные провайдеры

#### GeminiProvider - [services/ai/providers/GeminiProvider.ts](../services/ai/providers/GeminiProvider.ts)

**Google Gemini AI** с двухэтапным анализом снов.

**Особенности:**
- Использует библиотеку `@google/genai`
- **Stage 1:** Получает summary, analysis, advice, questions, symbol_names (одним запросом)
- **Stage 2:** Параллельно запрашивает детальное описание каждого символа
- Использует structured output (JSON schema) для надёжного парсинга
- Auto-repair для некорректного JSON

**Анализ сна:**
```typescript
async analyzeDream(dreamData: DreamData): Promise<AnalysisResponse>
```
- Модель из `model.model_id` (например, `gemini-2.0-flash-exp`)
- Temperature, max_tokens из `getModelConfig()`

**Генерация изображений:**
```typescript
async generateImage(prompt: string): Promise<string>
```
- Использует модель из `model.model_id` (например, `gemini-2.0-flash-exp` или другую, если настроена для image task)
- Возвращает base64 data URL: `data:image/png;base64,...`

---

#### OpenAIProvider - [services/ai/providers/OpenAIProvider.ts](../services/ai/providers/OpenAIProvider.ts)

**Универсальный провайдер** для OpenAI-compatible APIs (OpenAI, AiTunnel, NeuroAPI).

**Особенности:**
- Использует библиотеку `openai`
- `baseURL` берётся из `config.base_url`
- **Stage 1 + Stage 2:** Двухэтапный анализ как у Gemini
- Поддерживает `response_format: { type: 'json_object' }`

**Анализ сна:**
```typescript
async analyzeDream(dreamData: DreamData): Promise<AnalysisResponse>
```
- Модель из `model.model_id` (например, `gpt-5-mini`, `claude-sonnet-4-5`)
- Stage 1: summary, analysis, advice, questions, symbol_names
- Stage 2: Параллельный анализ символов

**Генерация изображений:**
```typescript
async generateImage(prompt: string): Promise<string>
```
- Использует `client.images.generate()`
- Поддерживает модели с `capabilities.image = true`
- Параметры из `model.model_config`: size, quality
- Форматы: `b64_json` (предпочтительно) или `url` (fallback)
- Возвращает base64 data URL

---

#### ClaudeProvider - [services/ai/providers/ClaudeProvider.ts](../services/ai/providers/ClaudeProvider.ts)

**Anthropic Claude** для анализа снов.

**Особенности:**
- Использует Anthropic API
- Двухэтапный анализ
- Пока не поддерживает генерацию изображений (Claude не имеет image generation)

---

## 🗄️ База данных

### Таблица: ai_provider_configs

Хранит конфигурацию всех подключённых провайдеров.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Primary key |
| `provider_type` | TEXT | Тип провайдера (unique): `gemini`, `openai`, `claude`, `aitunnel`, `neuroapi`, `custom` |
| `provider_name` | TEXT | Имя для отображения (например, "Google Gemini", "OpenAI") |
| `is_active` | BOOLEAN | **Legacy:** Активен ли провайдер глобально (не используется) |
| `is_active_for_text` | BOOLEAN | ✅ Активен для текстовых задач (анализ снов) |
| `is_active_for_images` | BOOLEAN | ✅ Активен для генерации изображений |
| `api_key_env_name` | TEXT | Имя переменной окружения с API ключом (например, `VITE_OPENAI_API_KEY`) |
| `base_url` | TEXT | Base URL для API запросов (для OpenAI-compatible) |
| `default_model_id` | UUID | **Legacy:** Модель по умолчанию (не используется) |
| `default_model_id_for_text` | UUID | ✅ Модель по умолчанию для текстовых задач (FK → ai_models.id) |
| `default_model_id_for_images` | UUID | ✅ Модель по умолчанию для генерации изображений (FK → ai_models.id) |
| `config` | JSONB | Дополнительные параметры: `{ temperature, max_tokens, top_p, ... }` |
| `created_at` | TIMESTAMPTZ | Дата создания |
| `updated_at` | TIMESTAMPTZ | Дата обновления |

**RLS:** Enabled (защищено на уровне БД)

---

### Таблица: ai_models

Хранит все доступные модели AI (175+ записей).

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Primary key |
| `provider_type` | TEXT | Тип провайдера (`gemini`, `openai`, `claude`, etc.) |
| `model_id` | TEXT | Идентификатор модели для API (например, `gpt-5-mini`, `claude-sonnet-4-5`) |
| `model_name` | TEXT | Человекочитаемое имя (например, "GPT-5 Mini", "Claude Sonnet 4.5") |
| `provider_name` | TEXT | Имя провайдера (например, "OpenAI", "Anthropic", "Google") |
| `capabilities` | JSONB | `{ text: boolean, image: boolean, reasoning: boolean }` |
| `pricing` | JSONB | `{ input: number, output: number, currency: string, per: string }` |
| `performance` | JSONB | `{ intelligence: string, speed: string }` |
| `context_length` | INTEGER | Максимальная длина контекста (в токенах) |
| `is_available` | BOOLEAN | Доступна ли модель |
| `model_config` | JSONB | Параметры модели: `{ temperature, max_tokens, top_p, size, quality, ... }` |
| `created_at` | TIMESTAMPTZ | Дата создания |

**RLS:** Enabled

**Capabilities:**
- `text: true` - Модель поддерживает текстовую генерацию (анализ снов)
- `image: true` - Модель поддерживает генерацию изображений
- `reasoning: true` - Модель поддерживает расширенное мышление (например, o1, o3)

---

## 🔧 Как добавить нового провайдера

### Шаг 1: Создать класс провайдера

Создай новый файл `/services/ai/providers/YourProvider.ts`:

```typescript
import { BaseProvider } from './BaseProvider';
import type { DreamData, AnalysisResponse } from '../../../types';

export class YourProvider extends BaseProvider {
  async analyzeDream(dreamData: DreamData): Promise<AnalysisResponse> {
    // Реализация анализа через твой API
    const apiKey = this.getApiKey();
    const modelConfig = this.getModelConfig();

    // Запрос к API...
    const response = await yourApi.analyze({
      model: this.model.model_id,
      prompt: this.buildPrompt(dreamData),
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.max_tokens
    });

    return this.validateResponse(response);
  }

  async generateImage(prompt: string): Promise<string> {
    // Реализация генерации изображений
    const apiKey = this.getApiKey();

    // Запрос к API...
    const response = await yourApi.generateImage({
      model: this.model.model_id,
      prompt: prompt
    });

    return response.imageUrl; // base64 data URL
  }
}
```

### Шаг 2: Добавить в AIProviderFactory

Обнови `/services/ai/AIProviderFactory.ts`:

```typescript
import { YourProvider } from './providers/YourProvider';

export class AIProviderFactory {
  static create(config: AIProviderConfig, model: AIModel): BaseProvider {
    switch (config.provider_type) {
      // ... существующие кейсы

      case 'yourprovider':
        return new YourProvider(config, model);

      default:
        throw new Error(`Unknown provider type: ${config.provider_type}`);
    }
  }
}
```

### Шаг 3: Добавить в БД

#### 3.1. Обновить типы в [types.ts](../types.ts):

```typescript
export type AIProviderType = 'gemini' | 'openai' | 'claude' | 'aitunnel' | 'neuroapi' | 'yourprovider' | 'custom';
```

#### 3.2. Создать миграцию `/supabase/migrations/YYYYMMDD_add_yourprovider.sql`:

```sql
-- Add provider config
INSERT INTO ai_provider_configs (
  provider_type,
  provider_name,
  api_key_env_name,
  base_url,
  is_active_for_text,
  is_active_for_images
) VALUES (
  'yourprovider',
  'Your Provider Name',
  'VITE_YOURPROVIDER_KEY',
  'https://api.yourprovider.com/v1',
  false,
  false
);

-- Add models
INSERT INTO ai_models (
  provider_type,
  model_id,
  model_name,
  provider_name,
  capabilities,
  pricing,
  performance,
  context_length,
  model_config
) VALUES
(
  'yourprovider',
  'your-model-v1',
  'Your Model v1',
  'Your Provider Name',
  '{"text": true, "image": false, "reasoning": false}'::jsonb,
  '{"input": 0.5, "output": 1.5, "currency": "USD", "per": "1M tokens"}'::jsonb,
  '{"intelligence": "high", "speed": "fast"}'::jsonb,
  128000,
  '{"temperature": 0.4, "max_tokens": 8192}'::jsonb
);
```

### Шаг 4: Применить миграцию

```bash
# Через Supabase CLI или UI
supabase db push

# Или через mcp__supabase__apply_migration
```

### Шаг 5: Добавить API ключ в .env

```bash
VITE_YOURPROVIDER_KEY=your_api_key_here
```

### Шаг 6: Активировать в админ-панели

1. Перейди в **Admin Panel** → **AI Providers**
2. Найди своего провайдера
3. Выбери модель по умолчанию для text/image
4. Активируй для нужных типов задач (`is_active_for_text`, `is_active_for_images`)

---

## 🎯 Использование в коде

### Анализ сна

```typescript
import { aiService } from './services/ai/aiService';

const analysis = await aiService.analyzeDream({
  description: 'Я видел сон про полёт...',
  context: {
    emotion: 'Радость',
    lifeSituation: 'Сменил работу',
    associations: 'Свобода',
    recurring: false,
    dayResidue: 'Смотрел фильм про птиц',
    characterType: 'Незнакомцы',
    dreamRole: 'Активный участник',
    physicalSensation: 'Лёгкость'
  },
  method: 'jungian'
});

console.log(analysis.summary); // Краткое резюме
console.log(analysis.analysis); // Глубокий анализ
console.log(analysis.symbolism); // Символы
console.log(analysis.advice); // Советы
console.log(analysis.questions); // Вопросы для рефлексии
```

### Генерация изображения

```typescript
import { aiService } from './services/ai/aiService';

const imageUrl = await aiService.generateImage(
  'Surreal dream landscape with floating islands and glowing moon'
);

console.log(imageUrl); // data:image/png;base64,...
```

### Проверка активного провайдера

```typescript
// Для текстовых задач
const textProviderInfo = await aiService.getActiveProviderInfo('text');
console.log(textProviderInfo.config.provider_name); // "OpenAI"
console.log(textProviderInfo.model.model_name); // "GPT-5 Mini"

// Для генерации изображений
const imageProviderInfo = await aiService.getActiveProviderInfo('image');
console.log(imageProviderInfo.config.provider_name); // "Google Gemini"
console.log(imageProviderInfo.model.model_name); // "Gemini 2.0 Flash"
```

### Сброс кэша

```typescript
// Сбросить кэш для текстового провайдера
aiService.clearCache('text');

// Сбросить кэш для image провайдера
aiService.clearCache('image');

// Сбросить весь кэш
aiService.clearCache();
```

---

## 🔍 Troubleshooting

### Ошибка: "API key not found"

**Причина:** Не установлена переменная окружения с API ключом.

**Решение:**
1. Проверь `.env` файл
2. Убедись, что переменная начинается с `VITE_` (для клиента)
3. Перезапусти dev server после изменений в `.env`

### Ошибка: "No active provider for text/images"

**Причина:** Ни один провайдер не активирован для этого типа задачи.

**Решение:**
1. Перейди в **Admin Panel** → **AI Providers**
2. Активируй провайдера для нужного типа задачи
3. Убедись, что выбрана модель по умолчанию

### Ошибка: "Model does not support image generation"

**Причина:** Модель не имеет `capabilities.image = true`.

**Решение:**
1. Проверь `ai_models` таблицу - у модели должно быть `capabilities.image = true`
2. Выбери другую модель для генерации изображений в админ-панели

### Провайдер не появляется в админ-панели

**Причина:** Провайдер не добавлен в `ai_provider_configs` таблицу.

**Решение:**
1. Создай миграцию с INSERT в `ai_provider_configs`
2. Примени миграцию через Supabase
3. Обнови страницу админ-панели

---

## 📚 Связанные документы

- [DATABASE.md](DATABASE.md) - Подробная схема БД
- [ADMIN_PANEL.md](ADMIN_PANEL.md) - Управление провайдерами через админ-панель
- [DREAM_ANALYSIS.md](DREAM_ANALYSIS.md) - Как работает анализ снов
- [CLAUDE.md](../CLAUDE.md) - Главный индекс документации
