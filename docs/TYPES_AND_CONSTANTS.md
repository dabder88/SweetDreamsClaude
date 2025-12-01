# TYPES_AND_CONSTANTS - Типы и константы

> **Summary:** Справочник всех TypeScript типов, интерфейсов, enum'ов и констант, используемых в PsyDream.

---

## ⚠️ ВАЖНО: Обновление документации

После добавления/изменения типов или констант **ОБЯЗАТЕЛЬНО** обновляй этот файл и [CLAUDE.md](../CLAUDE.md).

---

## 📘 types.ts

**Файл:** [types.ts](../types.ts)

### Enum: PsychMethod

**Строки:** [types.ts:2-9](../types.ts:2-9)

```typescript
export enum PsychMethod {
  AUTO = 'auto',               // AI выбирает подход
  JUNGIAN = 'jungian',         // Юнгианский анализ
  FREUDIAN = 'freudian',       // Фрейдистский психоанализ
  GESTALT = 'gestalt',         // Гештальт-терапия
  COGNITIVE = 'cognitive',     // Когнитивная психология
  EXISTENTIAL = 'existential'  // Экзистенциальный подход
}
```

### Interface: DreamContext

**Строки:** [types.ts:11-20](../types.ts:11-20)

```typescript
export interface DreamContext {
  emotion: string;             // Эмоция при пробуждении
  lifeSituation: string;       // Жизненная ситуация
  associations: string;        // Ассоциации со сном
  recurring: boolean;          // Повторяющийся сон
  dayResidue: string;          // Остаток дня
  characterType: string;       // Типы персонажей
  dreamRole: string;           // Роль сновидца
  physicalSensation: string;   // Физические ощущения
}
```

### Interface: DreamData

**Строки:** [types.ts:22-26](../types.ts:22-26)

```typescript
export interface DreamData {
  description: string;
  context: DreamContext;
  method: PsychMethod;
}
```

### Interface: DreamSymbol

**Строки:** [types.ts:28-31](../types.ts:28-31)

```typescript
export interface DreamSymbol {
  name: string;        // Название символа
  meaning: string;     // Детальное толкование
}
```

### Interface: AnalysisResponse

**Строки:** [types.ts:33-39](../types.ts:33-39)

```typescript
export interface AnalysisResponse {
  summary: string;              // Краткое резюме
  symbolism: DreamSymbol[];     // Массив символов
  analysis: string;             // Глубокий анализ (Markdown)
  advice: string[];             // Массив советов
  questions: string[];          // Вопросы для рефлексии
}
```

### Interface: User

**Строки:** [types.ts:41-52](../types.ts:41-52)

```typescript
export interface User {
  id: string;
  email: string;
  created_at: string;
  name?: string;
  avatar_url?: string;
  gender?: 'male' | 'female';
  date_of_birth?: string;
  role?: 'user' | 'admin';
  balance?: number;
  privacy_hide_dreams?: boolean;
}
```

### Interface: JournalEntry

**Строки:** [types.ts:54-62](../types.ts:54-62)

```typescript
export interface JournalEntry {
  id: string;
  user_id?: string;
  timestamp: number;
  dreamData: DreamData;
  analysis: AnalysisResponse | string;
  imageUrl?: string | null;
  notes?: string;
}
```

### Interface: AnalysisMetadata

**Строки:** [types.ts:64-81](../types.ts:64-81)

```typescript
export interface AnalysisMetadata {
  id: string;
  user_id: string;
  timestamp: number;
  method: PsychMethod;
  emotion: string;
  recurring: boolean;
  symbols: string[];
  dream_description?: string;
  life_situation?: string;
  created_at?: string;
}
```

### Type: AppView

**Строки:** [types.ts:82](../types.ts:82)

```typescript
export type AppView =
  | 'wizard'
  | 'landing'
  | 'dashboard'
  | 'journal'
  | 'dreamView'
  | 'analytics'
  | 'archetypes'
  | 'settings'
  | 'auth'
  | 'admin';
```

---

## 🔐 Admin Panel Types

### Enum: AdminActionType

**Строки:** [types.ts:88-97](../types.ts:88-97)

```typescript
export enum AdminActionType {
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  BALANCE_CREDITED = 'BALANCE_CREDITED',
  BALANCE_DEBITED = 'BALANCE_DEBITED',
  PROVIDER_CHANGED = 'PROVIDER_CHANGED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT'
}
```

### Interface: AuditLogEntry

**Строки:** [types.ts:99-107](../types.ts:99-107)

```typescript
export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action_type: AdminActionType;
  target_user_id?: string;
  details: any;
  ip_address?: string;
  created_at: string;
}
```

### Interface: UsageMetric

**Строки:** [types.ts:111-123](../types.ts:111-123)

```typescript
export interface UsageMetric {
  id: string;
  user_id?: string;
  action_type: 'dream_analysis' | 'image_generation' | 'archetype_analysis';
  provider_used: string;
  model_used: string;
  tokens_used?: number;
  response_time_ms: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}
```

### Interface: UserBalance

**Строки:** [types.ts:125-131](../types.ts:125-131)

```typescript
export interface UserBalance {
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}
```

### Enum: TransactionType

**Строки:** [types.ts:133-143](../types.ts:133-143)

```typescript
export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  PURCHASE = 'purchase',
  MANUAL_CREDIT = 'manual_credit',
  MANUAL_DEBIT = 'manual_debit',
  ADMIN_CREDIT = 'admin_credit',
  ADMIN_DEBIT = 'admin_debit',
  DREAM_ANALYSIS = 'dream_analysis',
  IMAGE_GENERATION = 'image_generation',
  REFUND = 'refund'
}
```

### Enum: TransactionStatus

**Строки:** [types.ts:145-150](../types.ts:145-150)

```typescript
export enum TransactionStatus {
  SUCCESS = 'success',
  PENDING = 'pending',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

### Interface: Transaction

**Строки:** [types.ts:152-164](../types.ts:152-164)

```typescript
export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  status: TransactionStatus;
  description?: string;
  admin_id?: string;
  metadata?: any;
  created_at: string;
}
```

---

## 📊 Analytics Types

### Interface: ActivityDataPoint

**Строки:** [types.ts:198-202](../types.ts:198-202)

```typescript
export interface ActivityDataPoint {
  date: string;
  count: number;
  users: number;
}
```

### Interface: MethodStats

**Строки:** [types.ts:204-210](../types.ts:204-210)

```typescript
export interface MethodStats {
  method: PsychMethod;
  methodName: string;
  count: number;
  percentage: number;
  color: string;
}
```

### Type: AnalyticsPeriod

**Строки:** [types.ts:240](../types.ts:240)

```typescript
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'year' | 'all';
```

---

## 🤖 AI Provider Types

### Type: AIProviderType

**Строки:** [types.ts:246](../types.ts:246)

```typescript
export type AIProviderType =
  | 'gemini'
  | 'openai'
  | 'claude'
  | 'aitunnel'
  | 'neuroapi'
  | 'custom';
```

### Type: AITaskType

**Строки:** [types.ts:253](../types.ts:253)

```typescript
export type AITaskType = 'text' | 'image';
```

### Interface: AIProviderConfig

**Строки:** [types.ts:255-285](../types.ts:255-285)

```typescript
export interface AIProviderConfig {
  id: string;
  provider_type: AIProviderType;
  provider_name: string;

  // Legacy field
  is_active: boolean;

  // Task-specific activation
  is_active_for_text?: boolean;
  is_active_for_images?: boolean;

  api_key_env_name?: string;
  base_url?: string;

  // Legacy field
  default_model_id?: string;

  // Task-specific default models
  default_model_id_for_text?: string;
  default_model_id_for_images?: string;

  config: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}
```

### Interface: AIModel

**Строки:** [types.ts:287-318](../types.ts:287-318)

```typescript
export interface AIModel {
  id: string;
  provider_type: AIProviderType;
  model_id: string;
  model_name: string;
  provider_name?: string;
  capabilities: {
    text: boolean;
    image: boolean;
    reasoning: boolean;
  };
  pricing: {
    input: number;
    output: number;
    currency: string;
    per: string;
  };
  performance: {
    intelligence: 'low' | 'medium' | 'high' | 'highest';
    speed: 'slow' | 'medium' | 'fast' | 'fastest';
  };
  context_length: number;
  is_available: boolean;
  model_config?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    [key: string]: any;
  };
  created_at: string;
}
```

---

## 📄 constants.ts

**Файл:** [constants.ts](../constants.ts)

### PSYCH_METHODS

**Строки:** [constants.ts:4-59](../constants.ts:4-59)

Метаданные для всех методов психоанализа (name, description, icon, colors).

```typescript
export const PSYCH_METHODS = [
  {
    id: PsychMethod.AUTO,
    name: 'Рекомендация ИИ',
    description: 'Позвольте ИИ выбрать лучшую психологическую концепцию...',
    icon: Sparkles,
    color: 'text-purple-300',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-500/30'
  },
  // ... остальные методы
];
```

### PREBUILT_EMOTIONS

**Строки:** [constants.ts:61-63](../constants.ts:61-63)

Предустановленные эмоции для ContextForm.

```typescript
export const PREBUILT_EMOTIONS = [
  "Тревога/Страх",
  "Радость/Экстаз",
  "Замешательство",
  "Грусть/Горе",
  "Гнев",
  "Покой/Облегчение",
  "Стыд/Вина"
];
```

---

## 🎭 constants/archetypes.ts

**Файл:** [constants/archetypes.ts](../constants/archetypes.ts)

Метаданные для 12 юнгианских архетипов:
- Hero (Герой)
- Sage (Мудрец)
- Explorer (Исследователь)
- Rebel (Бунтарь)
- Creator (Творец)
- Ruler (Правитель)
- Magician (Маг)
- Lover (Любовник)
- Caregiver (Опекун)
- Jester (Шут)
- Everyman (Простой человек)
- Innocent (Невинный)

Каждый архетип содержит:
- name (имя)
- description (описание)
- traits (черты характера)
- shadow (теневая сторона)
- examples (примеры из культуры)

---

## 🏆 constants/achievements.ts

**Файл:** [constants/achievements.ts](../constants/achievements.ts)

Система достижений (если используется).

**Примеры достижений:**
- "Первый сон" - анализировал первый сон
- "Сонный исследователь" - 10 снов
- "Мастер толкований" - 50 снов
- "Самопознание" - использовал все методы
- etc.

---

## 📚 Связанные документы

- [DATABASE.md](DATABASE.md) - Структура БД, соответствующая этим типам
- [ARCHITECTURE.md](ARCHITECTURE.md) - Использование типов в приложении
- [AI_PROVIDERS.md](AI_PROVIDERS.md) - AI provider types
- [ADMIN_PANEL.md](ADMIN_PANEL.md) - Admin types
- [CLAUDE.md](../CLAUDE.md) - Главный индекс
