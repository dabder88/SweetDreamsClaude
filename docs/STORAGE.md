# STORAGE - Система хранения данных

> **Summary:** PsyDream использует гибридную систему хранения: Supabase (primary) + localStorage (fallback). Автоматическая миграция localStorage → Supabase при первом входе.

---

## ⚠️ ВАЖНО: Обновление документации

После изменений в системе хранения **ОБЯЗАТЕЛЬНО** обновляй этот файл и [CLAUDE.md](../CLAUDE.md).

**Что требует обновления:**
- Изменения в структуре JournalEntry
- Новые методы в supabaseStorageService или storageService
- Изменения в логике миграции
- Новые таблицы для хранения данных

---

## 🏗️ Архитектура гибридного хранилища

```
┌─────────────────────┐
│   React Component   │
│  (DreamJournal.tsx) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│ supabaseStorageService.ts   │ ← Primary storage
│ - saveJournalEntry()        │
│ - getJournalEntries()       │
│ - updateEntryNotes()        │
│ - deleteJournalEntry()      │
└──────────┬──────────────────┘
           │
           ▼
    ┌──────────────┐
    │  Supabase?   │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │ Yes       │ No
     ▼           ▼
┌─────────┐  ┌──────────────┐
│Supabase │  │storageService│ ← Fallback
│   DB    │  │(localStorage)│
└─────────┘  └──────────────┘
```

---

## 🗄️ Primary Storage: Supabase

**Файл:** [services/supabaseStorageService.ts](../services/supabaseStorageService.ts)

### Основные функции

| Функция | Описание |
|---------|----------|
| `saveJournalEntry(entry)` | Сохранить сон в dream_entries |
| `getJournalEntries(userId)` | Получить все сны пользователя |
| `getJournalEntryById(id)` | Получить конкретный сон по ID |
| `updateEntryNotes(id, notes)` | Обновить заметки к сну |
| `deleteJournalEntry(id)` | Удалить сон |
| `migrateLocalEntriesToSupabase()` | Миграция из localStorage |

### Таблица: dream_entries

См. [DATABASE.md](DATABASE.md#dream_entries) для полной структуры.

**Столбцы:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Владелец записи
- `timestamp` (BIGINT) - Unix timestamp
- `dream_data` (JSONB) - Данные сна
- `analysis` (JSONB) - Результат анализа
- `image_url` (TEXT) - URL изображения
- `notes` (TEXT) - Заметки пользователя
- `created_at` (TIMESTAMPTZ) - Дата создания

### RLS Policies

```sql
-- Пользователи видят только свои сны
CREATE POLICY "Users can view own dreams"
  ON dream_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователи могут изменять только свои сны
CREATE POLICY "Users can update own dreams"
  ON dream_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Пользователи могут удалять только свои сны
CREATE POLICY "Users can delete own dreams"
  ON dream_entries FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 💾 Fallback Storage: localStorage

**Файл:** [services/storageService.ts](../services/storageService.ts)

### Когда используется

- Supabase **не настроен** (нет VITE_SUPABASE_URL в .env)
- Supabase **недоступен** (ошибка подключения)
- Пользователь **не залогинен** (работа в оффлайн режиме)

### localStorage Key

```typescript
const STORAGE_KEY = 'mindscape_journal_v1';
```

### Структура данных

```typescript
// localStorage['mindscape_journal_v1']
[
  {
    id: "uuid-1",
    timestamp: 1701234567890,
    dreamData: { description: "...", context: {...}, method: "jungian" },
    analysis: { summary: "...", symbolism: [...], ... },
    imageUrl: "data:image/png;base64,...",
    notes: "Заметка пользователя"
  },
  {
    id: "uuid-2",
    // ...
  }
]
```

### Основные функции

```typescript
// Получить все записи
export const getJournalEntries = (): JournalEntry[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Сохранить запись
export const saveJournalEntry = (entry: JournalEntry): void => {
  const entries = getJournalEntries();
  entries.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

// Удалить запись
export const deleteJournalEntry = (id: string): void => {
  const entries = getJournalEntries().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};
```

---

## 🔄 Миграция localStorage → Supabase

**Функция:** `migrateLocalEntriesToSupabase()`

**Файл:** [services/supabaseStorageService.ts](../services/supabaseStorageService.ts)

### Когда происходит

- Автоматически при **первом входе** пользователя
- Вызывается в [App.tsx](../App.tsx) после успешной аутентификации

### Алгоритм

```
1. Проверить, залогинен ли пользователь
   ↓
2. Проверить, есть ли уже записи в Supabase
   ↓ (если нет)
3. Загрузить записи из localStorage
   ↓
4. Для каждой записи:
   - Добавить user_id
   - Сохранить в dream_entries (INSERT)
   - Создать analysis_metadata
   ↓
5. Вернуть количество мигрированных записей
```

**Код:**

```typescript
export const migrateLocalEntriesToSupabase = async (): Promise<number> => {
  const user = await getCurrentUser();
  if (!user) return 0;

  // Проверить, есть ли уже записи в Supabase
  const { data: existing } = await supabase
    .from('dream_entries')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log('Migration already completed');
    return 0;
  }

  // Загрузить из localStorage
  const localEntries = storageService.getJournalEntries();

  if (localEntries.length === 0) {
    console.log('No local entries to migrate');
    return 0;
  }

  console.log(`Migrating ${localEntries.length} entries...`);

  // Загрузить в Supabase
  let migratedCount = 0;
  for (const entry of localEntries) {
    try {
      await saveJournalEntry({
        ...entry,
        user_id: user.id
      });
      migratedCount++;
    } catch (err) {
      console.error(`Failed to migrate entry ${entry.id}:`, err);
    }
  }

  console.log(`Migration completed: ${migratedCount}/${localEntries.length}`);
  return migratedCount;
};
```

**⚠️ ВАЖНО:**
- Оригинальные данные в localStorage **НЕ удаляются** (backup)
- Миграция происходит **только один раз** (проверка existing)
- Ошибки миграции **не блокируют** вход пользователя

---

## 📝 Структура JournalEntry

**Type:** [types.ts](../types.ts:54-62)

```typescript
export interface JournalEntry {
  id: string;                          // UUID записи
  user_id?: string;                    // UUID владельца (опционально для localStorage)
  timestamp: number;                   // Unix timestamp (миллисекунды)
  dreamData: DreamData;                // Данные сна
  analysis: AnalysisResponse | string; // Анализ (структурированный или legacy string)
  imageUrl?: string | null;            // URL изображения
  notes?: string;                      // Заметки пользователя
}
```

---

## 💡 Примеры использования

### Сохранение сна

```typescript
import { saveJournalEntry } from './services/supabaseStorageService';

const entry: JournalEntry = {
  id: crypto.randomUUID(),
  user_id: user?.id,
  timestamp: Date.now(),
  dreamData: {
    description: "Описание сна...",
    context: { emotion: "Радость", ... },
    method: "jungian"
  },
  analysis: {
    summary: "Краткое резюме...",
    symbolism: [{ name: "Полёт", meaning: "..." }],
    analysis: "Детальный анализ...",
    advice: ["Совет 1", "Совет 2"],
    questions: ["Вопрос 1?"]
  },
  imageUrl: "data:image/png;base64,...",
  notes: ""
};

await saveJournalEntry(entry);
```

### Получение снов

```typescript
import { getJournalEntries } from './services/supabaseStorageService';

// Все сны текущего пользователя
const dreams = await getJournalEntries(user.id);

// Сортировка по дате (новые первые)
dreams.sort((a, b) => b.timestamp - a.timestamp);
```

### Обновление заметок

```typescript
import { updateEntryNotes } from './services/supabaseStorageService';

await updateEntryNotes(dreamId, "Интересный сон! Повторился через месяц.");
```

### Удаление сна

```typescript
import { deleteJournalEntry } from './services/supabaseStorageService';

await deleteJournalEntry(dreamId);
```

---

## 🔍 Analysis Metadata

**Таблица:** `analysis_metadata` (см. [DATABASE.md](DATABASE.md#analysis_metadata))

**Зачем нужна:**
- Лёгкие метаданные для статистики (не требует загрузки полного сна)
- Сохраняется **даже для несохранённых снов** (для архетипов)
- Используется в Analytics и Archetypes компонентах

**Создаётся автоматически** при сохранении сна:

```typescript
const metadata: AnalysisMetadata = {
  id: entry.id,
  user_id: user.id,
  timestamp: entry.timestamp,
  method: entry.dreamData.method,
  emotion: entry.dreamData.context.emotion,
  recurring: entry.dreamData.context.recurring,
  symbols: entry.analysis.symbolism.map(s => s.name),
  dream_description: entry.dreamData.description.substring(0, 500),
  life_situation: entry.dreamData.context.lifeSituation
};

await supabase.from('analysis_metadata').insert(metadata);
```

---

## ⚙️ Конфигурация

### Проверка наличия Supabase

```typescript
export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'your_supabase_project_url');
};
```

### Выбор storage в компонентах

```typescript
// В компонентах используется ТОЛЬКО supabaseStorageService
// Он сам решает, использовать Supabase или localStorage

import { getJournalEntries } from './services/supabaseStorageService';

// Внутри supabaseStorageService:
export const getJournalEntries = async (userId?: string) => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    return storageService.getJournalEntries();
  }

  // Use Supabase
  const { data, error } = await supabase
    .from('dream_entries')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  return data || [];
};
```

---

## 📚 Связанные документы

- [DATABASE.md](DATABASE.md) - Таблицы dream_entries и analysis_metadata
- [AUTHENTICATION.md](AUTHENTICATION.md) - Миграция при первом входе
- [DREAM_ANALYSIS.md](DREAM_ANALYSIS.md) - Сохранение результатов анализа
- [ARCHITECTURE.md](ARCHITECTURE.md) - Общая архитектура
- [CLAUDE.md](../CLAUDE.md) - Главный индекс
