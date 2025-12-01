# DATABASE - Схема базы данных

> **Summary:** PsyDream использует Supabase (PostgreSQL) для хранения пользовательских данных, снов, AI конфигураций, транзакций и аудит-логов. Все таблицы защищены Row Level Security (RLS). В БД находится 13 таблиц с 175+ моделями AI.

---

## ⚠️ ВАЖНО: Обновление документации

**Перед редактированием БД:**
1. **ОБЯЗАТЕЛЬНО** используй `mcp__supabase__list_tables` для проверки актуальной структуры таблиц
2. **НЕ ПОЛАГАЙСЯ ТОЛЬКО** на миграции в `/supabase/migrations/` - они могут быть неполными
3. После изменений в БД обнови этот файл и [CLAUDE.md](../CLAUDE.md)

**Что требует обновления DATABASE.md:**
- Создание новых таблиц
- Добавление/удаление столбцов
- Изменение типов данных
- Новые индексы или внешние ключи
- Изменения в RLS политиках
- Новые триггеры или функции

---

## 🗄️ Список таблиц

| Таблица | Описание | Записей (example) | RLS |
|---------|----------|-------------------|-----|
| [dream_entries](#dream_entries) | Журнал снов пользователей | 21 | ✅ |
| [analysis_metadata](#analysis_metadata) | Метаданные анализов для статистики | 22 | ✅ |
| [ai_provider_configs](#ai_provider_configs) | Конфигурация AI провайдеров | 5 | ✅ |
| [ai_models](#ai_models) | Модели AI (175+ записей) | 175 | ✅ |
| [admin_users](#admin_users) | Администраторы системы | 4 | ✅ |
| [admin_audit_log](#admin_audit_log) | Аудит действий администраторов | 5 | ✅ |
| [audit_log](#audit_log) | Общий аудит-лог (legacy) | 36 | ✅ |
| [user_balances](#user_balances) | Балансы пользователей | 7 | ✅ |
| [transactions](#transactions) | История транзакций | 4 | ✅ |
| [subscription_plans](#subscription_plans) | Планы подписок | 0 | ✅ |
| [user_subscriptions](#user_subscriptions) | Подписки пользователей | 0 | ✅ |
| [usage_metrics](#usage_metrics) | Метрики использования AI | 0 | ✅ |
| [system_settings](#system_settings) | Системные настройки | 3 | ✅ |

---

## 📋 Детальное описание таблиц

### <a name="dream_entries"></a>1. dream_entries

**Назначение:** Хранит журнал снов пользователей с анализами и изображениями.

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key, уникальный ID записи |
| `user_id` | UUID | YES | - | Foreign Key → `auth.users.id`, владелец записи |
| `timestamp` | BIGINT | NO | - | Unix timestamp создания сна (миллисекунды) |
| `dream_data` | JSONB | NO | - | Данные сна: `{ description, context, method }` |
| `analysis` | JSONB | YES | - | Результат анализа: `{ summary, symbolism, analysis, advice, questions }` |
| `image_url` | TEXT | YES | - | URL или base64 data URL сгенерированного изображения |
| `notes` | TEXT | YES | - | Личные заметки пользователя к сну |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Дата создания записи (Postgres timestamp) |

**Индексы:**
- Primary Key: `id`
- Foreign Key: `user_id` → `auth.users.id` (ON DELETE CASCADE)

**RLS Policies:**
- Users can SELECT own dreams: `auth.uid() = user_id`
- Users can INSERT own dreams: `auth.uid() = user_id`
- Users can UPDATE own dreams: `auth.uid() = user_id`
- Users can DELETE own dreams: `auth.uid() = user_id`

**Пример записи:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "user-uuid-here",
  "timestamp": 1701234567890,
  "dream_data": {
    "description": "Я видел сон про полёт...",
    "context": {
      "emotion": "Радость",
      "lifeSituation": "Сменил работу",
      "associations": "Свобода",
      "recurring": false,
      "dayResidue": "Смотрел фильм про птиц",
      "characterType": "Незнакомцы",
      "dreamRole": "Активный участник",
      "physicalSensation": "Лёгкость"
    },
    "method": "jungian"
  },
  "analysis": {
    "summary": "Сон о полёте символизирует...",
    "symbolism": [
      { "name": "Полёт", "meaning": "..." },
      { "name": "Птицы", "meaning": "..." }
    ],
    "analysis": "### Основной анализ\n...",
    "advice": ["Совет 1", "Совет 2"],
    "questions": ["Вопрос 1?", "Вопрос 2?"]
  },
  "image_url": "data:image/png;base64,...",
  "notes": "Очень яркий сон!",
  "created_at": "2024-11-29T10:42:47.890Z"
}
```

**Связанные файлы:**
- [supabaseStorageService.ts](../services/supabaseStorageService.ts) - CRUD операции
- [DreamJournal.tsx](../components/DreamJournal.tsx) - отображение журнала

---

### <a name="analysis_metadata"></a>2. analysis_metadata

**Назначение:** Легковесные метаданные анализов для статистики и архетипов. Сохраняются даже для несохранённых снов.

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `id` | TEXT | NO | - | Primary Key, уникальный ID анализа |
| `user_id` | UUID | NO | - | Foreign Key → `auth.users.id`, владелец |
| `timestamp` | BIGINT | NO | - | Unix timestamp анализа |
| `method` | TEXT | NO | - | Метод анализа: `jungian`, `freudian`, `gestalt`, `cognitive`, `existential`, `auto` |
| `emotion` | TEXT | NO | - | Эмоция при пробуждении |
| `recurring` | BOOLEAN | NO | `false` | Повторяющийся сон |
| `symbols` | TEXT[] | NO | `'{}'` | Массив названий символов |
| `dream_description` | TEXT | YES | - | Краткое описание сна (для архетипов) |
| `life_situation` | TEXT | YES | - | Жизненная ситуация (контекст) |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Дата создания |

**Индексы:**
- Primary Key: `id`
- Foreign Key: `user_id` → `auth.users.id` (ON DELETE CASCADE)

**RLS Policies:**
- Users can SELECT own metadata: `auth.uid() = user_id`
- Users can INSERT own metadata: `auth.uid() = user_id`
- Users can UPDATE own metadata: `auth.uid() = user_id`
- Users can DELETE own metadata: `auth.uid() = user_id`

**Зачем нужна эта таблица:**
- **Статистика:** Подсчёт частоты методов, эмоций, символов
- **Архетипы:** Анализ профиля пользователя на основе всех снов (использует `dream_description`)
- **Cross-device sync:** Метаданные синхронизируются даже для несохранённых снов

**Связанные файлы:**
- [analysisMetadataService.ts](../services/analysisMetadataService.ts) - CRUD операции
- [Archetypes.tsx](../components/Archetypes.tsx) - анализ архетипов
- [Analytics.tsx](../components/Analytics.tsx) - статистика пользователя

---

### <a name="ai_provider_configs"></a>3. ai_provider_configs

**Назначение:** Конфигурация всех подключённых AI провайдеров.

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `provider_type` | TEXT | NO | - | Тип провайдера (UNIQUE): `gemini`, `openai`, `claude`, `aitunnel`, `neuroapi`, `custom` |
| `provider_name` | TEXT | NO | `'Unknown Provider'` | Имя для отображения |
| `is_active` | BOOLEAN | YES | `false` | **Legacy:** Активен глобально (не используется) |
| `is_active_for_text` | BOOLEAN | YES | `false` | ✅ Активен для текстовых задач (анализ снов) |
| `is_active_for_images` | BOOLEAN | YES | `false` | ✅ Активен для генерации изображений |
| `api_key_env_name` | TEXT | YES | - | Имя переменной окружения с API ключом (например, `VITE_OPENAI_API_KEY`) |
| `base_url` | TEXT | YES | - | Base URL для API (для OpenAI-compatible) |
| `default_model_id` | UUID | YES | - | **Legacy:** Модель по умолчанию (не используется) |
| `default_model_id_for_text` | UUID | YES | - | ✅ Модель по умолчанию для текста (FK → `ai_models.id`) |
| `default_model_id_for_images` | UUID | YES | - | ✅ Модель по умолчанию для изображений (FK → `ai_models.id`) |
| `config` | JSONB | YES | `'{}'` | Доп. параметры: `{ temperature, max_tokens, top_p, ... }` |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Дата создания |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | Дата обновления |

**Индексы:**
- Primary Key: `id`
- Unique: `provider_type`
- Foreign Keys:
  - `default_model_id` → `ai_models.id` (legacy)
  - `default_model_id_for_text` → `ai_models.id`
  - `default_model_id_for_images` → `ai_models.id`

**RLS:** Enabled

**Пример записи:**

```json
{
  "id": "uuid",
  "provider_type": "openai",
  "provider_name": "OpenAI",
  "is_active": false,
  "is_active_for_text": true,
  "is_active_for_images": false,
  "api_key_env_name": "VITE_OPENAI_API_KEY",
  "base_url": "https://api.openai.com/v1",
  "default_model_id": null,
  "default_model_id_for_text": "model-uuid-for-text",
  "default_model_id_for_images": null,
  "config": {
    "temperature": 0.4,
    "max_tokens": 8192,
    "top_p": 1.0
  }
}
```

**Связанные файлы:**
- [aiService.ts](../services/ai/aiService.ts) - загружает активный провайдер
- [adminService.ts](../services/adminService.ts) - CRUD операции
- [AIProviders.tsx](../components/AIProviders.tsx) - управление в админ-панели
- [AI_PROVIDERS.md](AI_PROVIDERS.md) - детальная документация

---

### <a name="ai_models"></a>4. ai_models

**Назначение:** Хранит все доступные модели AI (175+ записей).

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `provider_type` | TEXT | NO | - | Тип провайдера: `gemini`, `openai`, `claude`, `aitunnel`, `neuroapi`, `custom` |
| `model_id` | TEXT | NO | - | ID модели для API (например, `gpt-5-mini`, `claude-sonnet-4-5`) |
| `model_name` | TEXT | NO | - | Человекочитаемое имя (например, "GPT-5 Mini") |
| `provider_name` | TEXT | YES | - | Имя провайдера (например, "OpenAI", "Anthropic") |
| `capabilities` | JSONB | YES | `'{"text": true, "image": false, "reasoning": false}'` | Возможности модели |
| `pricing` | JSONB | YES | `'{"per": "1M tokens", "input": 0, "output": 0, "currency": "USD"}'` | Ценообразование |
| `performance` | JSONB | YES | `'{"speed": "medium", "intelligence": "medium"}'` | Производительность |
| `context_length` | INTEGER | YES | `128000` | Максимальная длина контекста (токены) |
| `is_available` | BOOLEAN | YES | `true` | Доступна ли модель |
| `model_config` | JSONB | YES | `'{"max_tokens": 8192, "temperature": 0.4}'` | Параметры модели |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Дата создания |

**Индексы:**
- Primary Key: `id`

**RLS:** Enabled

**Capabilities (JSONB):**

```json
{
  "text": true,      // Текстовая генерация (анализ снов)
  "image": false,   // Генерация изображений
  "reasoning": false // Расширенное мышление (o1, o3)
}
```

**Pricing (JSONB):**

```json
{
  "input": 0.5,         // Цена за 1M input токенов
  "output": 1.5,        // Цена за 1M output токенов
  "currency": "USD",    // Валюта
  "per": "1M tokens"    // Единица измерения
}
```

**Performance (JSONB):**

```json
{
  "intelligence": "high",  // low, medium, high, highest
  "speed": "fast"          // slow, medium, fast, fastest
}
```

**Model Config (JSONB):**

```json
{
  "temperature": 0.4,
  "max_tokens": 8192,
  "top_p": 1.0,
  "size": "1024x1024",    // Для image моделей
  "quality": "hd"          // Для image моделей
}
```

**Связанные файлы:**
- [aiService.ts](../services/ai/aiService.ts) - загружает модель для провайдера
- [adminService.ts](../services/adminService.ts) - CRUD операции
- [AIProviders.tsx](../components/AIProviders.tsx) - управление моделями
- [AI_PROVIDERS.md](AI_PROVIDERS.md) - детальная документация

---

### <a name="admin_users"></a>5. admin_users

**Назначение:** Список администраторов системы.

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `user_id` | UUID | NO | - | Primary Key, Foreign Key → `auth.users.id` |
| `role` | TEXT | YES | `'admin'` | Роль администратора (всегда `'admin'`) |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Дата назначения |

**Индексы:**
- Primary Key: `user_id`
- Foreign Key: `user_id` → `auth.users.id` (ON DELETE CASCADE)

**RLS:** Enabled

**Связанные таблицы:**
- `system_settings.updated_by` → `admin_users.user_id`
- `transactions.admin_id` → `admin_users.user_id`
- `admin_audit_log.admin_id` → `admin_users.user_id`

**Связанные файлы:**
- [authService.ts](../services/authService.ts) - проверка роли администратора
- [AdminPanel.tsx](../components/AdminPanel.tsx) - админ-панель

---

### <a name="admin_audit_log"></a>6. admin_audit_log

**Назначение:** Журнал действий администраторов для аудита безопасности.

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `admin_id` | UUID | YES | - | Foreign Key → `admin_users.user_id`, кто выполнил |
| `action_type` | TEXT | NO | - | Тип действия (см. `AdminActionType` enum) |
| `target_user_id` | UUID | YES | - | Foreign Key → `auth.users.id`, над кем выполнено |
| `details` | JSONB | YES | - | Детали действия (параметры, изменения) |
| `ip_address` | TEXT | YES | - | IP адрес администратора |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Дата действия |

**Индексы:**
- Primary Key: `id`
- Foreign Keys:
  - `admin_id` → `admin_users.user_id`
  - `target_user_id` → `auth.users.id`

**RLS:** Enabled

**Action Types (см. [types.ts](../types.ts:88-97)):**

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

**Пример записи:**

```json
{
  "id": "uuid",
  "admin_id": "admin-uuid",
  "action_type": "BALANCE_CREDITED",
  "target_user_id": "user-uuid",
  "details": {
    "amount": 1000,
    "currency": "RUB",
    "reason": "Промо-акция"
  },
  "ip_address": "192.168.1.100",
  "created_at": "2024-11-29T10:42:47.890Z"
}
```

**Связанные файлы:**
- [adminService.ts](../services/adminService.ts) - логирование действий
- [AuditLog.tsx](../components/AuditLog.tsx) - просмотр журнала

---

### <a name="audit_log"></a>7. audit_log

**Назначение:** Общий аудит-лог (legacy, используется параллельно с `admin_audit_log`).

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `admin_id` | UUID | YES | - | Foreign Key → `auth.users.id`, кто выполнил |
| `action_type` | TEXT | NO | - | Тип действия |
| `target_user_id` | UUID | YES | - | Foreign Key → `auth.users.id`, над кем выполнено |
| `details` | JSONB | YES | - | Детали действия |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Дата действия |

**Индексы:**
- Primary Key: `id`
- Foreign Keys:
  - `admin_id` → `auth.users.id`
  - `target_user_id` → `auth.users.id`

**RLS:** Enabled

**Примечание:** Эта таблица дублирует функционал `admin_audit_log`, но `admin_id` ссылается на `auth.users.id` вместо `admin_users.user_id`. Возможно, планируется миграция или удаление.

---

### <a name="user_balances"></a>8. user_balances

**Назначение:** Хранит балансы пользователей (для будущей монетизации).

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `user_id` | UUID | NO | - | Primary Key, Foreign Key → `auth.users.id` |
| `balance` | NUMERIC | YES | `0.00` | Баланс пользователя |
| `currency` | TEXT | YES | `'RUB'` | Валюта баланса |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Дата создания |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | Дата обновления |

**Индексы:**
- Primary Key: `user_id`
- Foreign Key: `user_id` → `auth.users.id` (ON DELETE CASCADE)

**RLS:** Enabled

**Связанные таблицы:**
- `transactions` - история изменений баланса

**Связанные файлы:**
- [adminService.ts](../services/adminService.ts) - управление балансами
- [UserDetail.tsx](../components/UserDetail.tsx) - просмотр и редактирование

---

### <a name="transactions"></a>9. transactions

**Назначение:** История транзакций (пополнения, списания, покупки).

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | YES | - | Foreign Key → `auth.users.id`, владелец |
| `type` | TEXT | NO | - | Тип транзакции (см. `TransactionType` enum) |
| `amount` | NUMERIC | NO | - | Сумма транзакции |
| `balance_before` | NUMERIC | YES | - | Баланс до транзакции |
| `balance_after` | NUMERIC | YES | - | Баланс после транзакции |
| `status` | TEXT | YES | `'success'` | Статус: `success`, `pending`, `failed`, `cancelled` |
| `description` | TEXT | YES | - | Описание транзакции |
| `admin_id` | UUID | YES | - | Foreign Key → `admin_users.user_id`, кто выполнил (для manual операций) |
| `metadata` | JSONB | YES | - | Доп. данные транзакции |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Дата транзакции |

**Индексы:**
- Primary Key: `id`
- Foreign Keys:
  - `user_id` → `auth.users.id`
  - `admin_id` → `admin_users.user_id`

**Check constraints:**
- `type` IN (`deposit`, `withdrawal`, `purchase`, `manual_credit`, `manual_debit`, `refund`)
- `status` IN (`success`, `pending`, `failed`, `cancelled`)

**RLS:** Enabled

**Transaction Types (см. [types.ts](../types.ts:132-143)):**

```typescript
export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  PURCHASE = 'purchase',
  MANUAL_CREDIT = 'manual_credit',
  MANUAL_DEBIT = 'manual_debit',
  ADMIN_CREDIT = 'admin_credit',    // Alias для MANUAL_CREDIT
  ADMIN_DEBIT = 'admin_debit',      // Alias для MANUAL_DEBIT
  DREAM_ANALYSIS = 'dream_analysis',
  IMAGE_GENERATION = 'image_generation',
  REFUND = 'refund'
}
```

**Связанные файлы:**
- [adminService.ts](../services/adminService.ts) - создание транзакций
- [UserDetail.tsx](../components/UserDetail.tsx) - история транзакций

---

### <a name="subscription_plans"></a>10. subscription_plans

**Назначение:** Планы подписок (пока не используются, 0 записей).

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `name` | TEXT | NO | - | Название плана |
| `description` | TEXT | YES | - | Описание плана |
| `price` | NUMERIC | NO | - | Цена плана |
| `currency` | TEXT | YES | `'RUB'` | Валюта |
| `duration_days` | INTEGER | YES | - | Длительность (null для одноразовых) |
| `features` | JSONB | YES | - | Возможности: `{ dream_analyses, image_generations, ... }` |
| `is_active` | BOOLEAN | YES | `true` | Активен ли план |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Дата создания |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | Дата обновления |

**Индексы:**
- Primary Key: `id`

**RLS:** Enabled

**Связанные таблицы:**
- `user_subscriptions.plan_id` → `subscription_plans.id`

---

### <a name="user_subscriptions"></a>11. user_subscriptions

**Назначение:** Подписки пользователей (пока не используются, 0 записей).

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | YES | - | Foreign Key → `auth.users.id` |
| `plan_id` | UUID | YES | - | Foreign Key → `subscription_plans.id` |
| `status` | TEXT | YES | `'active'` | Статус: `active`, `cancelled`, `expired` |
| `started_at` | TIMESTAMPTZ | YES | `now()` | Дата начала |
| `expires_at` | TIMESTAMPTZ | YES | - | Дата окончания |
| `auto_renew` | BOOLEAN | YES | `false` | Автопродление |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Дата создания |

**Индексы:**
- Primary Key: `id`
- Foreign Keys:
  - `user_id` → `auth.users.id`
  - `plan_id` → `subscription_plans.id`

**Check constraints:**
- `status` IN (`active`, `cancelled`, `expired`)

**RLS:** Enabled

---

### <a name="usage_metrics"></a>12. usage_metrics

**Назначение:** Метрики использования AI (для мониторинга, пока не используется, 0 записей).

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | YES | - | Foreign Key → `auth.users.id` |
| `action_type` | TEXT | NO | - | Тип действия: `dream_analysis`, `image_generation`, `archetype_analysis` |
| `provider_used` | TEXT | YES | - | Использованный провайдер |
| `model_used` | TEXT | YES | - | Использованная модель |
| `tokens_used` | INTEGER | YES | - | Использовано токенов |
| `response_time_ms` | INTEGER | YES | - | Время ответа (мс) |
| `success` | BOOLEAN | YES | `true` | Успешен ли запрос |
| `error_message` | TEXT | YES | - | Сообщение об ошибке |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Дата запроса |

**Индексы:**
- Primary Key: `id`
- Foreign Key: `user_id` → `auth.users.id`

**RLS:** Enabled

**Связанные файлы:**
- Пока не используется, но может быть интегрирован в `aiService.ts` для логирования

---

### <a name="system_settings"></a>13. system_settings

**Назначение:** Глобальные системные настройки (key-value хранилище).

**Структура:**

| Столбец | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| `key` | TEXT | NO | - | Primary Key, название настройки |
| `value` | JSONB | NO | - | Значение настройки (JSONB) |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | Дата обновления |
| `updated_by` | UUID | YES | - | Foreign Key → `admin_users.user_id`, кто обновил |

**Индексы:**
- Primary Key: `key`
- Foreign Key: `updated_by` → `admin_users.user_id`

**RLS:** Enabled

**Пример записей:**

```json
{
  "key": "maintenance_mode",
  "value": { "enabled": false, "message": "" },
  "updated_at": "2024-11-29T10:42:47.890Z",
  "updated_by": "admin-uuid"
}
```

```json
{
  "key": "default_free_analyses",
  "value": { "count": 5 },
  "updated_at": "2024-11-29T10:42:47.890Z",
  "updated_by": "admin-uuid"
}
```

---

## 🔒 Row Level Security (RLS)

**Все таблицы** в проекте имеют `RLS enabled = true`. Это означает, что:

1. **По умолчанию:** Пользователи НЕ имеют доступа к данным
2. **Политики (Policies)** явно разрешают доступ на основе условий
3. **Защита на уровне БД:** Даже если код содержит уязвимость, RLS защищает данные

**Типичные политики:**

```sql
-- Пользователи видят только свои записи
CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

-- Администраторы видят всё
CREATE POLICY "Admins can view all"
  ON table_name FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));
```

---

## 📁 Миграции

Все миграции находятся в `/supabase/migrations/`:

| Файл | Описание |
|------|----------|
| `20250129_create_ai_providers.sql` | Создание таблиц `ai_provider_configs`, `ai_models` |
| `20250129_seed_ai_providers.sql` | Первичное заполнение провайдеров |
| `20250129_seed_image_models.sql` | Добавление моделей для генерации изображений |
| `20250129_split_ai_tasks.sql` | Разделение провайдеров на text/image задачи |
| `20250130_update_aitunnel_models.sql` | Обновление моделей AiTunnel |
| `20250131_update_neuroapi_models.sql` | Добавление 68 моделей NeuroAPI |
| `20250201_add_openai_text_models.sql` | Добавление текстовых моделей OpenAI |
| `20250201_add_openai_image_models.sql` | Добавление image моделей OpenAI (DALL-E) |
| `admin_role_management.sql` | Создание `admin_users`, `audit_log` |
| `add_privacy_hide_dreams.sql` | Добавление поля privacy |

**⚠️ ВАЖНО:** Миграции могут быть неполными! Всегда проверяй реальную структуру БД через `mcp__supabase__list_tables` перед редактированием.

---

## 🛠️ Работа с БД через MCP Tools

### Просмотр таблиц

```typescript
// Список всех таблиц
mcp__supabase__list_tables({ project_id: 'your-project-id' });

// Список таблиц в конкретной схеме
mcp__supabase__list_tables({
  project_id: 'your-project-id',
  schemas: ['public']
});
```

### Выполнение SQL

```typescript
// Запрос данных (безопасно для SELECT)
mcp__supabase__execute_sql({
  project_id: 'your-project-id',
  query: 'SELECT * FROM ai_models WHERE capabilities->>\'image\' = \'true\''
});
```

### Применение миграций

```typescript
// Применить DDL миграцию
mcp__supabase__apply_migration({
  project_id: 'your-project-id',
  name: 'add_new_column',
  query: 'ALTER TABLE dream_entries ADD COLUMN tags TEXT[];'
});
```

**⚠️ ВАЖНО:** Для DDL операций (CREATE, ALTER, DROP) используй `apply_migration`. Для DML (INSERT, UPDATE, DELETE) используй `execute_sql`.

---

## 📚 Связанные документы

- [AI_PROVIDERS.md](AI_PROVIDERS.md) - Система AI провайдеров и моделей
- [STORAGE.md](STORAGE.md) - Гибридное хранилище (Supabase + localStorage)
- [ADMIN_PANEL.md](ADMIN_PANEL.md) - Управление данными через админ-панель
- [AUTHENTICATION.md](AUTHENTICATION.md) - Supabase Auth и RLS
- [CLAUDE.md](../CLAUDE.md) - Главный индекс документации
