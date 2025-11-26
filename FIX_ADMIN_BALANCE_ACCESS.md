# Исправление ошибки доступа к балансам пользователей (406 Error)

## Проблема

При попытке просмотра пользователей в админ-панели возникает ошибка:
```
GET https://yrasjvzpdvwzpvnhvjfx.supabase.co/rest/v1/user_balances?select=*&user_id=eq.xxx
[HTTP/2 406]
```

**Причина:** RLS политики на таблице `user_balances` не дают админу право читать балансы других пользователей.

## Шаги по исправлению

### Шаг 1: Проверка статуса админа

1. Откройте [Supabase SQL Editor](https://app.supabase.com)
2. Выполните содержимое файла `CHECK_ADMIN_STATUS.sql`
3. Посмотрите на результаты:

**Ожидаемые результаты:**

- **Check 1** - должен показать ваш user ID и email
- **Check 2** - должна быть **1 строка** с вашим user_id и role='admin'
  - ❌ Если пусто - вы НЕ админ! Перейдите к "Решение проблемы отсутствия в admin_users"
- **Check 3** - список всех админов (должен включать вас)
- **Check 4** - должно быть **4 политики** (SELECT, INSERT, UPDATE, DELETE)
- **Check 5** - должны отобразиться балансы (если ошибка - проблема в RLS)
- **Check 6** - должно быть **true** (если false - вы не админ)

### Шаг 2: Исправление RLS политик

1. Выполните содержимое файла `VERIFY_AND_FIX_RLS.sql`
2. Этот скрипт:
   - Удалит ВСЕ старые политики на `user_balances`
   - Создаст новые корректные политики
   - Покажет результаты для проверки

3. После выполнения должно быть **ровно 4 политики**:
   - `Users and admins can view balances` (SELECT)
   - `System and admins can create balances` (INSERT)
   - `Users and admins can update balances` (UPDATE)
   - `Admins can delete balances` (DELETE)

### Шаг 3: Проверка работы

1. Перезагрузите страницу админ-панели
2. Откройте раздел "Пользователи"
3. Балансы должны загружаться без ошибок 406

## Решение проблемы отсутствия в admin_users

Если **Check 2** показал пустой результат, выполните:

```sql
-- Добавить себя в админы вручную
-- ЗАМЕНИТЕ 'your-email@example.com' на ваш реальный email
INSERT INTO admin_users (user_id, role)
SELECT
  id,
  'admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- Проверить что добавились
SELECT
  au.user_id,
  au.role,
  u.email
FROM admin_users au
LEFT JOIN auth.users u ON u.id = au.user_id;
```

## Дополнительная диагностика

### Проверка через браузерную консоль

1. Откройте консоль браузера (F12)
2. Выполните в консоли:

```javascript
// Проверить текущего пользователя
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Проверить админ статус
const { data: adminCheck } = await supabase
  .from('admin_users')
  .select('*')
  .eq('user_id', user.id)
  .single();
console.log('Admin check:', adminCheck);

// Попробовать получить балансы
const { data: balances, error } = await supabase
  .from('user_balances')
  .select('*')
  .limit(5);
console.log('Balances:', balances, 'Error:', error);
```

### Логи Supabase

1. Перейдите в дашборд Supabase
2. Откройте **Logs** → **Database**
3. Найдите запросы к `user_balances`
4. Посмотрите на ошибки и политики, которые их блокируют

## Причины проблемы

1. **Старые политики не удалены** - могут конфликтовать с новыми
2. **Админ не в таблице admin_users** - auto-promotion не сработал
3. **Кеш политик** - Supabase может кешировать RLS политики
4. **Синтаксис политик** - ошибка в EXISTS подзапросе

## Финальная проверка

После всех исправлений:

✅ Админ-панель → Пользователи → список загружается
✅ Балансы отображаются для всех пользователей
✅ Можно открыть карточку пользователя
✅ Можно изменить баланс (пополнить/списать)
✅ История транзакций отображается

## Если ничего не помогло

1. Проверьте что вы выполняете SQL от имени того же пользователя, под которым логинитесь в админ-панель
2. Попробуйте выйти и войти заново в приложение
3. Очистите localStorage в браузере и перелогиньтесь
4. Проверьте что используете правильный Supabase проект (URL совпадает с .env)

## Контакты для помощи

Если проблема не решается, предоставьте:
- Результаты всех 6 проверок из CHECK_ADMIN_STATUS.sql
- Скриншот ошибки из консоли браузера
- Логи из Supabase Dashboard → Logs → Database
