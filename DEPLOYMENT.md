# Руководство по развертыванию и безопасности (Deployment Guide)

Это руководство описывает шаги, необходимые для превращения прототипа **Mindscape** в полноценный продакшн-сервис, с акцентом на безопасность API-ключей и архитектуру данных.

---

## 1. 🚨 Проблема безопасности API ключей

В текущей версии (Frontend-only) API-ключ Google Gemini хранится в переменных среды клиента или передается напрямую в браузере.
**Почему это недопустимо для публичного сайта:**
1.  **Утечка ключей:** Любой пользователь может открыть DevTools (F12) -> Network и увидеть ваш ключ в запросе или найти его в исходном коде JS.
2.  **Кража квот:** Злоумышленники могут использовать ваш платный лимит токенов для своих ботов.
3.  **Блокировка аккаунта:** Провайдеры (Google, OpenAI) могут забанить ключ, если обнаружат его в публичном доступе.

**Решение:** Ключи должны храниться **только на сервере (Backend)**. Клиент (браузер) никогда не должен знать API-ключ.

---

## 2. Целевая Архитектура (Production)

```mermaid
Client (React App)
   |
   |  (1. Запрос с токеном авторизации пользователя)
   v
Your Backend Server (Proxy)
   |  [Хранилище секретов: .env]
   |  - API_KEY_GEMINI
   |  - API_KEY_OPENAI
   |
   |  (2. Запрос с подставленным ключом)
   v
AI Providers (Google / OpenAI / Anthropic)
```

---

## 3. Создание Backend-прокси (Пример на Node.js/Express)

Вам понадобится создать отдельный сервер или Serverless-функцию (если используете Vercel/Next.js).

### Шаг 3.1. Инициализация проекта
```bash
mkdir mindscape-backend
cd mindscape-backend
npm init -y
npm install express cors dotenv @google/genai openai
```

### Шаг 3.2. Структура сервера (`server.js`)

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors({ origin: 'https://your-mindscape-domain.com' })); // Разрешаем запросы только с вашего домена
app.use(express.json());

// Инициализация клиентов ИИ
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Эндпоинт для анализа сна
app.post('/api/analyze', async (req, res) => {
  try {
    // 1. Здесь можно проверить авторизацию пользователя (JWT)
    // if (!req.user) return res.status(401).send('Unauthorized');

    const { description, context, method } = req.body;

    // 2. Вызов Gemini API (ключ берется из ENV сервера)
    const response = await geminiClient.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Промпт на основе ${description}...`,
      // ... конфигурация
    });

    // 3. Отправка чистого результата клиенту
    res.json(response.text);

  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to process dream' });
  }
});

app.listen(3000, () => console.log('Proxy server running on port 3000'));
```

### Шаг 3.3. Обновление Фронтенда (`services/geminiService.ts`)

Вместо прямого вызова `GoogleGenAI` в React, вы делаете запрос к своему серверу:

```typescript
// Было:
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// const response = await ai.models.generateContent(...)

// Стало:
const analyzeDream = async (data: DreamData) => {
  const response = await fetch('https://api.your-domain.com/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await response.json();
}
```

---

## 4. Мульти-модельная поддержка

Если вы хотите использовать разных провайдеров (OpenAI, Claude) в зависимости от тарифа пользователя:

1.  Получите ключи от всех провайдеров.
2.  Добавьте их в `.env` на сервере:
    ```env
    GEMINI_API_KEY=...
    OPENAI_API_KEY=...
    ANTHROPIC_API_KEY=...
    ```
3.  На бэкенде реализуйте "Фабрику моделей":
    ```javascript
    async function callAI(provider, prompt) {
      if (provider === 'openai') {
         // Вызов GPT-4
      } else if (provider === 'anthropic') {
         // Вызов Claude 3.5 Sonnet
      } else {
         // Вызов Gemini (по умолчанию)
      }
    }
    ```

---

## 5. Миграция Базы Данных

Сейчас данные хранятся в `LocalStorage` браузера. При очистке кэша они пропадают. Для продакшна нужна настоящая БД.

**Рекомендуемый стек:**
*   **PostgreSQL** (через Supabase или Neon) — надежно, реляционно.
*   **Prisma ORM** — для удобной работы с БД в TypeScript.

**Схема БД (пример Prisma):**

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  isPro     Boolean  @default(false)
  dreams    Dream[]
}

model Dream {
  id          String   @id @default(uuid())
  userId      String
  description String
  analysis    Json     // Храним весь ответ ИИ как JSON
  emotion     String
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}
```

---

## 6. Переменные окружения (.env)

Никогда не коммитьте `.env` файл в GitHub! Добавьте его в `.gitignore`.

**Пример .env для сервера:**
```bash
# AI Keys
GEMINI_API_KEY="AIzaSy..."
OPENAI_API_KEY="sk-..."

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mindscape"

# Security
JWT_SECRET="super-secret-key-for-auth"
```

---

## 7. Хостинг

1.  **Frontend (React):** Vercel, Netlify (бесплатно и быстро).
2.  **Backend:**
    *   **Vercel Serverless Functions:** Идеально для Next.js, можно хранить бэкенд в том же репозитории.
    *   **Render / Railway:** Для классического Node.js сервера.
3.  **Database:** Supabase (Postgres), MongoDB Atlas.
