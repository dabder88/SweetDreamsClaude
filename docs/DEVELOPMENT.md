# DEVELOPMENT - Разработка и деплой

> **Summary:** Инструкции по локальной разработке, настройке окружения, деплою на Vercel и работе со скриптами.

---

## ⚠️ ВАЖНО: Обновление документации

После изменений в процессе разработки/деплоя **ОБЯЗАТЕЛЬНО** обновляй этот файл и [CLAUDE.md](../CLAUDE.md).

---

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-username/psydream.git
cd psydream
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Создание .env файла

Создай `.env` в корне проекта:

```env
# Gemini API Key
VITE_API_KEY=your_gemini_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI (optional)
VITE_OPENAI_API_KEY=your_openai_api_key

# Claude (optional)
VITE_CLAUDE_API_KEY=your_claude_api_key

# AiTunnel (optional)
VITE_AITUNNEL_KEY=your_aitunnel_key

# NeuroAPI (optional)
VITE_NEUROAPI_KEY=your_neuroapi_key
```

**⚠️ ВАЖНО:** Все переменные ДОЛЖНЫ начинаться с `VITE_` для работы в клиенте!

### 4. Запуск dev сервера

```bash
npm run dev
```

Приложение откроется на `http://localhost:5173`

---

## 🛠️ Доступные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запустить Vite dev server (hot reload) |
| `npm run build` | Production build в папку `/dist` |
| `npm run preview` | Предпросмотр production build |
| `npm run lint` | Проверка кода (если настроено) |

---

## 🔑 Получение API ключей

### Gemini API Key

1. Перейди на [Google AI Studio](https://ai.studio)
2. Войди с Google аккаунтом
3. Нажми "Get API Key"
4. Скопируй ключ в `.env` → `VITE_API_KEY`

**Ограничения бесплатного тира:**
- 15 requests per minute
- 1500 requests per day

### Supabase Credentials

1. Перейди на [Supabase](https://supabase.com)
2. Создай новый проект
3. Перейди в Settings → API
4. Скопируй:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### OpenAI API Key

1. Перейди на [OpenAI Platform](https://platform.openai.com)
2. Создай API key в разделе API Keys
3. Скопируй в `.env` → `VITE_OPENAI_API_KEY`

### Claude API Key

1. Перейди на [Anthropic Console](https://console.anthropic.com)
2. Создай API key
3. Скопируй в `.env` → `VITE_CLAUDE_API_KEY`

### AiTunnel / NeuroAPI

Получи ключи у соответствующих провайдеров.

---

## 🗄️ Настройка Supabase

### 1. Создать проект

1. Создай новый проект в Supabase Dashboard
2. Выбери регион (ближайший к пользователям)
3. Придумай пароль для БД (сохрани его!)

### 2. Применить миграции

**Через Supabase SQL Editor:**

1. Перейди в SQL Editor
2. Скопируй содержимое каждого файла из `/supabase/migrations/`
3. Выполни по порядку (сортировка по дате в имени)

**Важные миграции:**
- `admin_role_management.sql` - создание таблиц admin_users, audit_log
- `20250129_create_ai_providers.sql` - AI провайдеры и модели
- `20250129_seed_ai_providers.sql` - заполнение провайдеров
- `20250129_seed_image_models.sql` - модели для изображений
- `20250201_add_openai_text_models.sql` - OpenAI модели

### 3. Настроить Authentication

1. **Authentication** → **Providers**
2. Включить **Email** (включен по умолчанию)
3. Опционально: настроить OAuth (Google, GitHub, etc.)

**Email confirmation:**
- По умолчанию требуется подтверждение email
- Отключить можно в **Settings** → **Email Auth** → "Enable email confirmations"

### 4. Настроить Storage (для аватаров)

1. **Storage** → **Create bucket**
2. Название: `avatars`
3. Public bucket: **Yes**
4. Allowed MIME types: `image/*`

**RLS Policy для avatars:**

```sql
-- Пользователи могут загружать свои аватары
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Все могут просматривать аватары
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

---

## 📦 Production Build

### Локальный build

```bash
npm run build
```

Результат в папке `/dist`:
- `index.html`
- `/assets/` - JS, CSS, images

### Предпросмотр build

```bash
npm run preview
```

Откроется на `http://localhost:4173`

---

## 🚀 Деплой на Vercel

### 1. Подготовка

1. Создай аккаунт на [Vercel](https://vercel.com)
2. Подключи GitHub репозиторий

### 2. Импорт проекта

1. **New Project** → **Import Git Repository**
2. Выбери репозиторий PsyDream
3. **Framework Preset:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`

### 3. Настройка Environment Variables

Добавь все переменные из `.env`:

| Key | Value |
|-----|-------|
| `VITE_API_KEY` | Твой Gemini API key |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_OPENAI_API_KEY` | (optional) OpenAI key |
| `VITE_CLAUDE_API_KEY` | (optional) Claude key |
| `VITE_AITUNNEL_KEY` | (optional) AiTunnel key |
| `VITE_NEUROAPI_KEY` | (optional) NeuroAPI key |

**⚠️ ВАЖНО:** НЕ забывай префикс `VITE_`!

### 4. Deploy

1. Нажми **Deploy**
2. Дождись завершения build
3. Приложение доступно на `https://your-project.vercel.app`

### 5. Auto-deploy

При каждом push в `main` branch Vercel автоматически пересобирает приложение.

**Для preview deployments:**
- Push в другую ветку создаст preview URL

---

## 🛠️ Скрипты

### /scripts/apply-openai-migrations.js

**Назначение:** Применение миграций OpenAI моделей к Supabase

**Использование:**

```bash
node scripts/apply-openai-migrations.js
```

**Что делает:**
- Читает SQL миграции из `/supabase/migrations/`
- Применяет их к Supabase через API
- Логирует результаты

**Требования:**
- Установленные переменные окружения для Supabase
- Права администратора в Supabase

### /scripts/verify-openai-models.js

**Назначение:** Проверка моделей OpenAI в БД

**Использование:**

```bash
node scripts/verify-openai-models.js
```

**Что делает:**
- Запрашивает таблицу `ai_models`
- Фильтрует модели OpenAI
- Выводит список моделей с capabilities

---

## 🧪 Тестирование

### Локальное тестирование Supabase

1. Убедись, что `.env` настроен
2. Запусти `npm run dev`
3. Попробуй:
   - Регистрацию нового пользователя
   - Вход в систему
   - Создание анализа сна
   - Сохранение в журнал
   - Просмотр в админ-панели

### Проверка миграций

```bash
# Через Supabase CLI (если установлен)
supabase migration list
supabase migration up
```

### Проверка RLS политик

В Supabase Dashboard:
1. **Database** → **Roles**
2. Войди как `authenticated` пользователь
3. Попробуй запросить данные других пользователей (должно блокироваться)

---

## 🐛 Troubleshooting

### "API key not found"

**Проблема:** Переменная окружения не читается

**Решение:**
1. Проверь, что переменная начинается с `VITE_`
2. Перезапусти dev server после изменения `.env`
3. Убедись, что `.env` находится в корне проекта

### "Supabase connection failed"

**Проблема:** Неверные Supabase credentials

**Решение:**
1. Проверь `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
2. Убедись, что проект в Supabase активен
3. Проверь RLS политики (могут блокировать запросы)

### "No active provider for text/images"

**Проблема:** Ни один AI провайдер не активирован

**Решение:**
1. Перейди в Admin Panel → AI Providers
2. Активируй провайдера для нужного типа задачи
3. Выбери модель по умолчанию
4. Убедись, что API ключ настроен в `.env`

### Build fails on Vercel

**Проблема:** Ошибка при сборке на Vercel

**Решение:**
1. Проверь все Environment Variables в Vercel
2. Убедись, что все зависимости в `package.json`
3. Проверь логи build в Vercel Dashboard
4. Убедись, что `npm run build` работает локально

---

## 📚 Связанные документы

- [DATABASE.md](DATABASE.md) - Настройка БД и миграции
- [AUTHENTICATION.md](AUTHENTICATION.md) - Настройка Supabase Auth
- [AI_PROVIDERS.md](AI_PROVIDERS.md) - Получение API ключей
- [ARCHITECTURE.md](ARCHITECTURE.md) - Архитектура проекта
- [CLAUDE.md](../CLAUDE.md) - Главный индекс
