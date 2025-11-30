# ⚡ Быстрое исправление: Неверные модели для изображений

## Проблема

В **Админ-панели** → **AI Провайдеры** → **"ИИ для изображений"** отображаются текстовые модели вместо моделей генерации изображений.

## Решение (1 минута)

### Вариант 1: Через Supabase Dashboard (рекомендуется)

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Создайте новый запрос и вставьте:

```sql
-- Исправить текстовые модели с неправильным флагом image = true
UPDATE ai_models
SET capabilities = jsonb_set(capabilities, '{image}', 'false'::jsonb)
WHERE capabilities->>'text' = 'true'
  AND capabilities->>'image' = 'true';
```

5. Нажмите **Run** (или `Ctrl+Enter`)
6. Обновите страницу в Админ-панели

✅ **Готово!** Теперь в списке моделей для изображений будут только DALL-E, Imagen, Flux и другие модели генерации.

### Вариант 2: Через миграцию (для production)

```bash
# В Supabase SQL Editor выполните файл:
supabase/migrations/20250131_fix_text_models_image_capability.sql
```

## Проверка результата

После исправления выполните проверочный запрос:

```sql
-- Должно вернуть 0 строк (пусто)
SELECT provider_type, model_id, model_name
FROM ai_models
WHERE capabilities->>'text' = 'true'
  AND capabilities->>'image' = 'true';
```

И проверьте модели для изображений:

```sql
-- Должно вернуть 13+ моделей (DALL-E, Flux, Imagen, и т.д.)
SELECT provider_type, model_id, model_name, pricing
FROM ai_models
WHERE capabilities->>'image' = 'true'
ORDER BY provider_type;
```

## Ожидаемые модели для изображений

После исправления вы должны увидеть:

- **OpenAI Direct:** dall-e-3, dall-e-3-hd
- **AiTunnel:** dall-e-2, dall-e-3, flux.2-pro, flux.2-flex, seedream-4-0, qwen-image-edit, gpt-image-1
- **NeuroAPI:** gpt-image-1, gemini-2.5-flash-image, gemini-3-pro-image-preview
- **Google Gemini:** gemini-2.0-flash-exp (бета)

## Дополнительная информация

📄 **Подробная инструкция:** [supabase/FIX_IMAGE_MODELS.md](supabase/FIX_IMAGE_MODELS.md)
📊 **Структура БД:** [supabase/DATABASE_STRUCTURE.md](supabase/DATABASE_STRUCTURE.md)
🔍 **Скрипт диагностики:** [scripts/check-image-models.sql](scripts/check-image-models.sql)

---

**Дата:** 2025-01-31
