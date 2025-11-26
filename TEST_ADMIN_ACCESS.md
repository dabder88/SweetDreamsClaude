# Тест доступа админа к балансам

## Выполните в консоли браузера

Откройте консоль браузера (F12) на странице с админ-панелью и выполните:

```javascript
// Импортируем supabase из глобального контекста
const { supabase } = window;

// 1. Проверяем текущего пользователя
const { data: { user } } = await supabase.auth.getUser();
console.log('1. Current user:', user);
console.log('   Email:', user?.email);
console.log('   ID:', user?.id);

// 2. Проверяем статус админа
const { data: adminCheck, error: adminError } = await supabase
  .from('admin_users')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();

console.log('2. Admin check:', adminCheck);
console.log('   Error:', adminError);
console.log('   Is admin:', !!adminCheck);

// 3. Пробуем получить ВСЕ балансы (как админ)
const { data: allBalances, error: allError } = await supabase
  .from('user_balances')
  .select('*');

console.log('3. All balances:', allBalances);
console.log('   Error:', allError);
console.log('   Count:', allBalances?.length);

// 4. Пробуем получить конкретный баланс
const testUserId = 'ce63b625-3c8a-4402-9391-accea707e0a7'; // Один из ID из ошибок
const { data: singleBalance, error: singleError } = await supabase
  .from('user_balances')
  .select('*')
  .eq('user_id', testUserId)
  .maybeSingle();

console.log('4. Single balance for', testUserId);
console.log('   Data:', singleBalance);
console.log('   Error:', singleError);
```

## Ожидаемые результаты

Если вы АДМИН:
- **Шаг 1**: Должен показать ваш email (brainpinky@bk.ru) и user ID
- **Шаг 2**: `adminCheck` должен быть объект с role='admin', `Is admin: true`
- **Шаг 3**: Должны загрузиться ВСЕ балансы (без ошибок)
- **Шаг 4**: Должен загрузиться конкретный баланс (или null если нет записи)

Если вы НЕ АДМИН:
- **Шаг 2**: `adminCheck` будет null, `Is admin: false`
- **Шаг 3**: Ошибка доступа или пустой массив
- **Шаг 4**: Ошибка 406 или null

## Что делать если вы не админ

1. Проверьте email в консоли (шаг 1)
2. Убедитесь что этот email есть в `VITE_ADMIN_EMAILS` в `.env`
3. Выполните [ADD_ADMIN_BY_EMAIL.sql](ADD_ADMIN_BY_EMAIL.sql) снова с правильным email
4. Выйдите из приложения и войдите заново
5. Повторите тест

## Альтернативный тест (если window.supabase недоступен)

```javascript
// Используйте network tab в DevTools
// 1. Откройте Network tab (F12 -> Network)
// 2. Обновите страницу с пользователями
// 3. Найдите запросы к user_balances
// 4. Проверьте Headers -> Request Headers -> Authorization
// Должен быть Bearer токен с правами админа
```
