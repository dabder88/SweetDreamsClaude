# ЯЗЫК ОБЩЕНИЯ

Всегда отвечай ТОЛЬКО НА РУССКОМ ЯЗЫКЕ

---

# CLAUDE.md - Главная документация PsyDream

**PsyDream** - это React + TypeScript веб-приложение для психологического анализа снов с использованием универсальной системы AI провайдеров (Gemini, OpenAI, Claude, AiTunnel, NeuroAPI и др.). Приложение позволяет пользователям описывать сны, предоставлять контекст, выбирать метод психологического анализа (Юнгианский, Фрейдистский, Гештальт, Когнитивный, Экзистенциальный или Авто), и получать AI-интерпретации с анализом символизма и визуализацией.

---

## ⚠️ КРИТИЧЕСКИ ВАЖНО: Обновление документации

**После ЛЮБЫХ значимых изменений в проекте ты ОБЯЗАН обновить соответствующую документацию!**

### Что считается "значимыми изменениями"

| Изменение | Какие файлы обновить |
|-----------|----------------------|
| Добавление/удаление views, routes | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), этот файл |
| Изменения в схеме БД, таблицах, RLS политиках | [docs/DATABASE.md](docs/DATABASE.md), этот файл |
| Добавление/удаление AI провайдеров или моделей | [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md), этот файл |
| Изменения в wizard flow (шаги анализа снов) | [docs/DREAM_ANALYSIS.md](docs/DREAM_ANALYSIS.md), этот файл |
| Изменения в системе аутентификации, ролях | [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md), этот файл |
| Изменения в Admin Panel функциях | [docs/ADMIN_PANEL.md](docs/ADMIN_PANEL.md), этот файл |
| Добавление/удаление React компонентов | [docs/UI_COMPONENTS.md](docs/UI_COMPONENTS.md), этот файл |
| Изменения в TypeScript типах, интерфейсах, enum'ах | [docs/TYPES_AND_CONSTANTS.md](docs/TYPES_AND_CONSTANTS.md), этот файл |
| Изменения в storage системе (Supabase/localStorage) | [docs/STORAGE.md](docs/STORAGE.md), этот файл |
| Изменения в dev командах, deployment, API ключах | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md), этот файл |

**Важно:**
- Обновляй **сразу после** внесения изменений
- Обновляй **конкретные секции**, не переписывай весь файл
- Проверяй **cross-references** между файлами (ссылки могут устареть)

---

## 📚 Навигация по документации

### 🎯 Основные документы

Для **полного понимания** системы обязательно изучи эти документы:

| Документ | Описание | Когда использовать |
|----------|----------|-------------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Архитектура приложения, routing, state management | При изменении структуры приложения, добавлении views |
| [DATABASE.md](docs/DATABASE.md) | Полная схема БД (13 таблиц), RLS политики | Перед любыми изменениями в БД (**обязательно проверь Supabase!**) |
| [AI_PROVIDERS.md](docs/AI_PROVIDERS.md) | Универсальная система AI провайдеров (Factory + Strategy) | При работе с AI, добавлении провайдеров/моделей |
| [DREAM_ANALYSIS.md](docs/DREAM_ANALYSIS.md) | Wizard анализа снов (4 шага), two-stage analysis | При изменении логики анализа снов |
| [AUTHENTICATION.md](docs/AUTHENTICATION.md) | Supabase Auth, роли (user/admin), RLS | При работе с аутентификацией, ролями, защитой данных |

### 🔧 Дополнительные справочники

| Документ | Описание | Когда использовать |
|----------|----------|-------------------|
| [STORAGE.md](docs/STORAGE.md) | Гибридное хранилище (Supabase + localStorage) | При работе с сохранением/загрузкой данных |
| [ADMIN_PANEL.md](docs/ADMIN_PANEL.md) | Админ-панель (5 разделов), управление пользователями/AI | При работе с админ-функционалом |
| [UI_COMPONENTS.md](docs/UI_COMPONENTS.md) | Каталог всех React компонентов (30+) | При работе с UI, поиске нужного компонента |
| [TYPES_AND_CONSTANTS.md](docs/TYPES_AND_CONSTANTS.md) | Справочник TypeScript типов и констант | При работе с типами, поиске интерфейсов |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Dev setup, deployment на Vercel, API ключи | При настройке окружения, деплое |

---

## 🚀 Быстрый старт

### Локальная разработка

```bash
npm install          # Установка зависимостей
npm run dev          # Запуск Vite dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Предпросмотр production build
```

### Настройка окружения

Создай `.env` файл в корне проекта:

```env
# Gemini API Key (если используешь Gemini)
VITE_API_KEY=your_gemini_api_key_here

# Supabase Configuration (обязательно для Auth и БД)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API Key (опционально)
VITE_OPENAI_API_KEY=your_openai_api_key

# Claude API Key (опционально)
VITE_CLAUDE_API_KEY=your_claude_api_key

# AiTunnel Key (опционально)
VITE_AITUNNEL_KEY=your_aitunnel_key

# NeuroAPI Key (опционально)
VITE_NEUROAPI_KEY=your_neuroapi_key
```

**Критически важно:**
- Все переменные ДОЛЖНЫ начинаться с `VITE_` для работы в клиенте
- Подробнее о получении API ключей: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

## 🏗️ Архитектура и потоки данных

### Система маршрутизации (View-Based)

Приложение **НЕ использует** React Router. Вместо этого используется view-based система с типом `AppView`:

```typescript
export type AppView =
  | 'landing'      // Главная страница
  | 'auth'         // Логин/регистрация (Supabase Auth)
  | 'wizard'       // Wizard анализа снов (4 шага)
  | 'dashboard'    // Личный кабинет (защищён)
  | 'journal'      // Журнал снов (защищён)
  | 'analytics'    // Аналитика пользователя (защищён)
  | 'settings'     // Настройки профиля (защищён)
  | 'archetypes'   // Анализ архетипов (защищён)
  | 'admin'        // Админ-панель (требует admin роль)
  | 'dreamView';   // Просмотр отдельного сна (защищён)
```

Навигация через функцию `navigateTo(view: AppView)` в [App.tsx](App.tsx).

**Подробнее:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

### Поток анализа сна

```
1. User Input (3 шага wizard)
   ├─ Step 1: Описание сна (textarea)
   ├─ Step 2: Контекст (8 полей: emotion, lifeSituation, etc.)
   └─ Step 3: Выбор метода (PsychMethod enum)

2. AI Analysis (aiService.ts → активный провайдер)
   ├─ Stage 1: summary + analysis + advice + questions + symbol names
   └─ Stage 2: Параллельные запросы для детализации каждого символа

3. Результат (AnalysisResult.tsx)
   ├─ Отображение summary, analysis, symbolism, advice, questions
   └─ Опция генерации изображения (активный image provider)

4. Сохранение в журнал (опционально)
   └─ supabaseStorageService → dream_entries table (protected by RLS)
```

**Подробнее:** [docs/DREAM_ANALYSIS.md](docs/DREAM_ANALYSIS.md)

### Универсальная система AI провайдеров

PsyDream использует **универсальную систему AI провайдеров**, а не привязан к конкретному AI.

**Архитектура:**
- **AIService (Singleton)** - главный интерфейс для AI операций
- **AIProviderFactory** - создание провайдеров по типу
- **BaseProvider** - абстрактный базовый класс
- **Конкретные провайдеры** - GeminiProvider, OpenAIProvider, ClaudeProvider

**Task-based routing:**
- Отдельный провайдер для **text** задач (анализ снов)
- Отдельный провайдер для **image** задач (генерация изображений)
- Выбор в Admin Panel → AI Providers

**Поддерживаемые провайдеры:**
- Gemini (Google AI)
- OpenAI (GPT-4, DALL-E 3)
- Claude (Anthropic)
- AiTunnel (OpenAI-compatible API)
- NeuroAPI (67+ российских моделей)

**Подробнее:** [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md)

### Аутентификация и авторизация

**Supabase Auth** для регистрации, входа, управления пользователями.

**Роли:**
- `user` - обычный пользователь (доступ к своим снам)
- `admin` - администратор (доступ к админ-панели)

**Защита данных:**
- **Row Level Security (RLS)** - пользователи видят только свои данные
- Автоматическая миграция localStorage → Supabase при первом входе

**Подробнее:** [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md)

### Гибридное хранилище

**Primary:** Supabase (если настроен)
- `dream_entries` - журнал снов
- `analysis_metadata` - метаданные анализов
- `user_profiles` - профили пользователей
- И ещё 10 таблиц (см. [docs/DATABASE.md](docs/DATABASE.md))

**Fallback:** localStorage (если Supabase не настроен)
- Ключ `mindscape_journal_v1`
- Автоматическая миграция в Supabase при первом логине

**Подробнее:** [docs/STORAGE.md](docs/STORAGE.md)

---

## 📂 Важные файлы и директории

### Ключевые файлы приложения

| Файл | Описание |
|------|----------|
| [App.tsx](App.tsx) | Главный компонент: routing, layout, state management, authentication |
| [types.ts](types.ts) | Все TypeScript типы и enum'ы (см. [docs/TYPES_AND_CONSTANTS.md](docs/TYPES_AND_CONSTANTS.md)) |
| [constants.ts](constants.ts) | Метаданные методов психоанализа, предустановленные эмоции |

### AI система

| Файл | Описание |
|------|----------|
| [services/ai/aiService.ts](services/ai/aiService.ts) | Singleton для AI операций, task-based routing |
| [services/ai/AIProviderFactory.ts](services/ai/AIProviderFactory.ts) | Фабрика провайдеров |
| [services/ai/providers/BaseProvider.ts](services/ai/providers/BaseProvider.ts) | Абстрактный базовый класс |
| [services/ai/providers/GeminiProvider.ts](services/ai/providers/GeminiProvider.ts) | Gemini провайдер |
| [services/ai/providers/OpenAIProvider.ts](services/ai/providers/OpenAIProvider.ts) | OpenAI/AiTunnel/NeuroAPI провайдер |
| [services/ai/providers/ClaudeProvider.ts](services/ai/providers/ClaudeProvider.ts) | Claude провайдер |

### Сервисы хранения и аутентификации

| Файл | Описание |
|------|----------|
| [services/supabaseClient.ts](services/supabaseClient.ts) | Инициализация Supabase client |
| [services/supabaseStorageService.ts](services/supabaseStorageService.ts) | CRUD операции с Supabase |
| [services/storageService.ts](services/storageService.ts) | localStorage fallback |
| [services/authService.ts](services/authService.ts) | signUp, signIn, signOut, updateProfile, isAdmin |
| [services/adminService.ts](services/adminService.ts) | Админ-функции (управление пользователями, AI провайдерами) |

### React компоненты

| Директория | Описание |
|-----------|----------|
| [components/](components/) | Все React компоненты (30+ штук) |
| [components/Auth.tsx](components/Auth.tsx) | Логин/регистрация |
| [components/Sidebar.tsx](components/Sidebar.tsx) | Боковое меню навигации |
| [components/AdminPanel.tsx](components/AdminPanel.tsx) | Админ-панель |
| [components/DreamForm.tsx](components/DreamForm.tsx) | Wizard Step 1 |
| [components/ContextForm.tsx](components/ContextForm.tsx) | Wizard Step 2 |
| [components/MethodSelector.tsx](components/MethodSelector.tsx) | Wizard Step 3 |
| [components/AnalysisResult.tsx](components/AnalysisResult.tsx) | Wizard Step 4 |

**Полный каталог:** [docs/UI_COMPONENTS.md](docs/UI_COMPONENTS.md)

### База данных

| Директория | Описание |
|-----------|----------|
| [supabase/migrations/](supabase/migrations/) | SQL миграции (20+ файлов) |

**Подробнее о схеме:** [docs/DATABASE.md](docs/DATABASE.md)

---

## 🎯 Быстрая справка для частых задач

### Добавление нового AI провайдера

1. Создай класс провайдера в `/services/ai/providers/YourProvider.ts` (наследник `BaseProvider`)
2. Добавь case в `AIProviderFactory.create()` ([AIProviderFactory.ts:44-58](services/ai/AIProviderFactory.ts:44-58))
3. Добавь тип провайдера в `AIProviderType` ([types.ts:246](types.ts:246))
4. Создай миграцию для добавления провайдера в БД
5. **Обнови:** [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md), этот файл

**Подробная инструкция:** [docs/AI_PROVIDERS.md - "Добавление нового провайдера"](docs/AI_PROVIDERS.md)

### Добавление новой view (страницы)

1. Добавь view в `AppView` type ([types.ts:82](types.ts:82))
2. Создай компонент в `/components/YourView.tsx`
3. Добавь case в `renderCabinetContent()` или создай новый layout ([App.tsx](App.tsx))
4. Добавь кнопку навигации в [Sidebar.tsx](components/Sidebar.tsx)
5. Если view защищён, добавь его в `privateViews` array в `navigateTo()` ([App.tsx](App.tsx))
6. **Обновi:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/UI_COMPONENTS.md](docs/UI_COMPONENTS.md), этот файл

**Подробнее:** [docs/ARCHITECTURE.md - "View System"](docs/ARCHITECTURE.md)

### Добавление нового метода психоанализа

1. Добавь enum value в `PsychMethod` ([types.ts:2-9](types.ts:2-9))
2. Добавь метаданные в `PSYCH_METHODS` array ([constants.ts:4-59](constants.ts:4-59))
3. Добавь switch case в `buildPrompt()` в BaseProvider ([services/ai/providers/BaseProvider.ts](services/ai/providers/BaseProvider.ts))
4. **Обновi:** [docs/TYPES_AND_CONSTANTS.md](docs/TYPES_AND_CONSTANTS.md), [docs/DREAM_ANALYSIS.md](docs/DREAM_ANALYSIS.md), этот файл

### Изменение схемы БД

1. **ОБЯЗАТЕЛЬНО:** Проверь текущую структуру через `mcp__supabase__list_tables` (не только SQL файлы!)
2. Создай миграцию в `/supabase/migrations/YYYYMMDD_description.sql`
3. Примени миграцию через Supabase SQL Editor или CLI
4. Обнови RLS политики (если нужно)
5. Обнови TypeScript типы в [types.ts](types.ts)
6. **Обновi:** [docs/DATABASE.md](docs/DATABASE.md), [docs/TYPES_AND_CONSTANTS.md](docs/TYPES_AND_CONSTANTS.md), этот файл

**ВАЖНО:** Всегда проверяй реальную БД, а не только миграции! Схема может отличаться.

**Подробнее:** [docs/DATABASE.md](docs/DATABASE.md)

### Работа с Supabase

Проект использует MCP-сервер Supabase для прямого доступа к БД. Доступные команды:

```bash
# Список таблиц
mcp__supabase__list_tables

# Список моделей AI
mcp__supabase__execute_sql
# query: "SELECT * FROM ai_models WHERE provider_type = 'openai'"

# Применение миграции
mcp__supabase__apply_migration
# name: add_new_feature
# query: "CREATE TABLE..."
```

**Подробнее:** [docs/DATABASE.md](docs/DATABASE.md), [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

## 🚢 Deployment (Vercel)

1. Импортируй GitHub репозиторий в Vercel
2. Framework: **Vite**
3. Environment Variables:
   - `VITE_API_KEY` = Gemini key (если используешь)
   - `VITE_SUPABASE_URL` = Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase anon key
   - `VITE_OPENAI_API_KEY` = OpenAI key (опционально)
   - `VITE_CLAUDE_API_KEY` = Claude key (опционально)
   - `VITE_AITUNNEL_KEY` = AiTunnel key (опционально)
   - `VITE_NEUROAPI_KEY` = NeuroAPI key (опционально)
4. Auto-deploy при push в `main` branch

**Security Note:** API ключи exposed на клиенте (приемлемо для personal/prototype). Supabase использует RLS для защиты данных - anon key безопасен для публикации.

**Подробнее:** [docs/DEVELOPMENT.md - "Деплой на Vercel"](docs/DEVELOPMENT.md)

---

## ⚙️ Ключевые технические паттерны

### Получение API ключей

Функция `getApiKey()` в провайдерах имеет multi-fallback логику:

1. `import.meta.env.VITE_[PROVIDER]_API_KEY` (Vite standard)
2. `process.env.VITE_[PROVIDER]_API_KEY` (legacy/server)
3. `process.env.[PROVIDER]_API_KEY` (без префикса)
4. Возврат пустой строки если всё не найдено

Предотвращает ошибки в разных runtime окружениях (Vite dev, Vercel production, Node).

### Обработка ошибок

- Валидация API ключей внутри функций (не на уровне модуля) для предотвращения initialization errors
- JSON parsing с repair логикой для незакрытых quotes/brackets (частая проблема с AI truncation)
- Все AI вызовы обёрнуты в try-catch с user-friendly сообщениями об ошибках

### State Management

**Нет Redux/Zustand.** Всё состояние в [App.tsx](App.tsx) через `useState`:

- `view` (текущая страница)
- `step` (прогресс wizard, 1-4)
- `dreamData` (пользовательский input сна)
- `mobileMenuOpen` (toggle sidebar)
- `user` (объект залогиненного пользователя, null если не залогинен)
- `authLoading` (loading state при проверке аутентификации)
- `selectedDream` (выбранный сон для просмотра)
- `adminSubView` (текущий раздел админ-панели)

**Подробнее:** [docs/ARCHITECTURE.md - "Управление состоянием"](docs/ARCHITECTURE.md)

### Authentication Flow

1. При монтировании App: проверка существующей Supabase сессии
2. Подписка на изменения auth state (login/logout)
3. Автоматическая миграция localStorage entries в Supabase при первом логине
4. Защита private routes (редирект на auth если не залогинен)
5. Проверка admin роли для доступа к админ-панели

**Подробнее:** [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md)

---

## ⚠️ Известные ограничения

- **Rate limits:** Бесплатные тиры AI провайдеров имеют ограничения (например, Gemini: 15 RPM)
- **Доступность генерации изображений:** Зависит от доступа к моделям (некоторые регионы ограничены)
- **Язык:** Только русский язык (hardcoded в промптах и UI)
- **Email verification:** Требуется для Supabase sign-ups (настраивается в Supabase dashboard)

---

## 📚 Связанные документы

### Для глубокого понимания системы:

1. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Архитектура, routing, state, layouts
2. **[docs/DATABASE.md](docs/DATABASE.md)** - Полная схема БД (13 таблиц + RLS)
3. **[docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md)** - Универсальная система AI провайдеров
4. **[docs/DREAM_ANALYSIS.md](docs/DREAM_ANALYSIS.md)** - Wizard анализа снов (4 шага)
5. **[docs/AUTHENTICATION.md](docs/AUTHENTICATION.md)** - Supabase Auth, роли, RLS

### Для работы с конкретными задачами:

6. **[docs/STORAGE.md](docs/STORAGE.md)** - Гибридное хранилище (Supabase + localStorage)
7. **[docs/ADMIN_PANEL.md](docs/ADMIN_PANEL.md)** - Админ-панель (5 разделов)
8. **[docs/UI_COMPONENTS.md](docs/UI_COMPONENTS.md)** - Каталог React компонентов (30+)
9. **[docs/TYPES_AND_CONSTANTS.md](docs/TYPES_AND_CONSTANTS.md)** - TypeScript типы и константы
10. **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Dev setup, deployment, troubleshooting

---

## 🔥 Помни главное правило

**Перед любым изменением в системе:**

1. 📖 **Читай соответствующую документацию** (см. таблицу выше)
2. 🔍 **Проверяй актуальную структуру БД** через Supabase (если работаешь с БД)
3. ✍️ **Вноси изменения**
4. 📝 **ОБЯЗАТЕЛЬНО обнови документацию** (соответствующий MD файл + этот CLAUDE.md если нужно)
5. 🔗 **Проверь cross-references** между документами

**Документация - это не дополнительная работа, это часть кода. Устаревшая документация хуже, чем её отсутствие!**
