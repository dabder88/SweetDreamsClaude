# AUTHENTICATION - Аутентификация и авторизация

> **Summary:** PsyDream использует Supabase Auth для регистрации, входа и управления пользователями. Поддерживает email/password аутентификацию, роли (user/admin), и Row Level Security (RLS) для защиты данных.

---

## ⚠️ ВАЖНО: Обновление документации

После изменений в системе аутентификации **ОБЯЗАТЕЛЬНО** обновляй этот файл и [CLAUDE.md](../CLAUDE.md).

**Что требует обновления:**
- Добавление новых методов аутентификации (OAuth providers)
- Изменения в структуре User типа
- Новые роли пользователей
- Изменения в authService.ts
- Новые RLS политики

---

## 🔐 Supabase Authentication

### Основной сервис: authService.ts

**Файл:** [services/authService.ts](../services/authService.ts)

**Основные функции:**

| Функция | Описание |
|---------|----------|
| `signUp(email, password)` | Регистрация нового пользователя |
| `signIn(email, password)` | Вход в систему |
| `signOut()` | Выход из системы |
| `getCurrentUser()` | Получить текущего пользователя |
| `onAuthStateChange(callback)` | Подписка на изменения auth state |
| `updateUserProfile(userId, updates)` | Обновление профиля |
| `uploadAvatar(userId, file)` | Загрузка аватара |
| `isAdmin(user)` | Проверка роли администратора |

---

## 👤 User Type

**Файл:** [types.ts](../types.ts:41-52)

```typescript
export interface User {
  id: string;                    // UUID пользователя
  email: string;                 // Email адрес
  created_at: string;            // Дата регистрации (ISO string)
  name?: string;                 // Отображаемое имя
  avatar_url?: string;           // URL аватара (Supabase Storage)
  gender?: 'male' | 'female';    // Пол пользователя
  date_of_birth?: string;        // Дата рождения (YYYY-MM-DD)
  role?: 'user' | 'admin';       // Роль для контроля доступа
  balance?: number;              // Текущий баланс (для монетизации)
  privacy_hide_dreams?: boolean; // Скрыть сны от других админов
}
```

---

## 📝 Регистрация (Sign Up)

### Flow регистрации

```
1. Пользователь заполняет форму (email, password)
   ↓
2. authService.signUp(email, password)
   ↓
3. Supabase создаёт запись в auth.users
   ↓
4. Supabase отправляет email с подтверждением
   ↓
5. Пользователь кликает ссылку в email
   ↓
6. Email подтверждён, можно входить
```

**Код:**

```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password
});

if (error) throw error;
return data.user;
```

**Email подтверждение:**
- По умолчанию Supabase требует подтверждения email
- Отключить можно в Supabase Dashboard → Authentication → Settings
- Письмо приходит на указанный email (проверяй спам!)

---

## 🔑 Вход (Sign In)

### Flow входа

```
1. Пользователь вводит email и password
   ↓
2. authService.signIn(email, password)
   ↓
3. Supabase проверяет credentials
   ↓
4. Создаётся сессия (JWT токен)
   ↓
5. App.tsx: setUser(currentUser)
   ↓
6. Редирект на intendedView или dashboard
```

**Код:**

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

if (error) throw error;

// Загрузить дополнительные данные профиля
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', data.user.id)
  .single();

return { ...data.user, ...profile };
```

---

## 🚪 Выход (Sign Out)

**Код:**

```typescript
const { error } = await supabase.auth.signOut();
if (error) throw error;

// App.tsx автоматически обновит state через onAuthStateChange
```

---

## 🔄 Auth State Management

### Подписка на изменения

**Файл:** [App.tsx](../App.tsx) (useEffect)

```typescript
useEffect(() => {
  if (isSupabaseConfigured()) {
    const { data: authListener } = onAuthStateChange((newUser) => {
      setUser(newUser);

      // Если пользователь залогинился и есть intendedView
      if (newUser && intendedView) {
        navigateTo(intendedView);
        setIntendedView(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }
}, []);
```

### Получение текущего пользователя

```typescript
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Загрузить дополнительные данные профиля
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    created_at: user.created_at!,
    ...profile
  };
};
```

---

## 👑 Роли и права доступа

### Роли пользователей

| Роль | Описание | Права |
|------|----------|-------|
| `user` | Обычный пользователь | Доступ к своим снам, аналитике, настройкам |
| `admin` | Администратор | Доступ к админ-панели, управление пользователями, AI провайдерами |

### Проверка роли администратора

**Таблица:** `admin_users` (см. [DATABASE.md](DATABASE.md#admin_users))

```typescript
export const isAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  return !!data && !error;
};
```

### Защита админ-панели

**Файл:** [App.tsx](../App.tsx)

```typescript
const navigateTo = (newView: AppView) => {
  // Проверка для админ-панели
  if (newView === 'admin') {
    if (!user) {
      setIntendedView('admin');
      setView('auth');
      return;
    }

    // Проверить роль администратора
    isAdmin(user).then(isAdminUser => {
      if (!isAdminUser) {
        alert('У вас нет прав администратора');
        setView('dashboard');
      } else {
        setView('admin');
      }
    });
    return;
  }

  // Остальные защищённые routes...
};
```

---

## 🖼️ Профиль пользователя

### Обновление профиля

```typescript
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<void> => {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
};
```

### Загрузка аватара

```typescript
export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Загрузить в Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Получить публичный URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Обновить профиль
  await updateUserProfile(userId, { avatar_url: data.publicUrl });

  return data.publicUrl;
};
```

**Компонент:** [AvatarModal.tsx](../components/AvatarModal.tsx)

---

## 🔒 Row Level Security (RLS)

### Принцип работы

**Все таблицы** имеют RLS enabled. Это означает:

1. **По умолчанию:** Пользователи НЕ видят никаких данных
2. **Политики (Policies):** Явно разрешают доступ на основе `auth.uid()`
3. **Защита на уровне БД:** Даже если клиентский код содержит уязвимость, RLS защищает

### Примеры политик

**dream_entries:**

```sql
-- Пользователи видят только свои сны
CREATE POLICY "Users can view own dreams"
  ON dream_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Администраторы видят все сны (если privacy_hide_dreams = false)
CREATE POLICY "Admins can view all dreams"
  ON dream_entries FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    AND (
      auth.uid() = user_id
      OR NOT COALESCE(
        (SELECT privacy_hide_dreams FROM auth.users WHERE id = dream_entries.user_id),
        false
      )
    )
  );
```

**ai_provider_configs:**

```sql
-- Только администраторы могут изменять
CREATE POLICY "Admins can manage providers"
  ON ai_provider_configs FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
```

---

## 🛡️ Защищённые маршруты

**Файл:** [App.tsx](../App.tsx)

```typescript
const navigateTo = (newView: AppView) => {
  // Список защищённых views
  const privateViews: AppView[] = [
    'dashboard',
    'journal',
    'analytics',
    'archetypes',
    'settings',
    'admin',
    'dreamView'
  ];

  // Если route защищён и пользователь не залогинен
  if (privateViews.includes(newView) && !user && isSupabaseConfigured()) {
    setIntendedView(newView); // Запомнить куда хотел перейти
    setView('auth'); // Редирект на логин
    return;
  }

  setView(newView);
};
```

---

## 🔄 Миграция localStorage → Supabase

**Автоматическая миграция** при первом входе:

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
    return 0; // Уже мигрировано
  }

  // Загрузить из localStorage
  const localEntries = getJournalEntries(); // storageService.ts

  // Загрузить в Supabase
  let migratedCount = 0;
  for (const entry of localEntries) {
    await saveJournalEntry({
      ...entry,
      user_id: user.id
    });
    migratedCount++;
  }

  return migratedCount;
};
```

**Вызывается в:** [App.tsx](../App.tsx) (useEffect после успешного логина)

---

## ⚙️ Настройки Supabase

### Email Templates

**Где:** Supabase Dashboard → Authentication → Email Templates

Можно кастомизировать:
- Confirmation email (подтверждение email)
- Password reset (восстановление пароля)
- Magic link (вход по ссылке)

### OAuth Providers

**Где:** Supabase Dashboard → Authentication → Providers

Можно подключить:
- Google
- GitHub
- Facebook
- и другие...

**Пример добавления Google OAuth:**

1. Включить Google provider в Supabase
2. Получить Client ID и Secret из Google Cloud Console
3. Добавить в код:

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});
```

---

## 📚 Связанные документы

- [DATABASE.md](DATABASE.md) - RLS политики и таблицы auth
- [STORAGE.md](STORAGE.md) - Миграция localStorage → Supabase
- [ADMIN_PANEL.md](ADMIN_PANEL.md) - Управление пользователями
- [ARCHITECTURE.md](ARCHITECTURE.md) - Auth flow в приложении
- [CLAUDE.md](../CLAUDE.md) - Главный индекс
