# ADMIN_PANEL - Административная панель

> **Summary:** Админ-панель PsyDream предоставляет управление пользователями, AI провайдерами, аналитикой и аудит-логом. Доступна только пользователям с ролью admin.

---

## ⚠️ ВАЖНО: Обновление документации

После изменений в админ-панели **ОБЯЗАТЕЛЬНО** обновляй этот файл и [CLAUDE.md](../CLAUDE.md).

**Что требует обновления:**
- Добавление новых разделов админ-панели
- Новые функции в adminService.ts
- Изменения в компонентах админ-панели
- Новые права доступа

---

## 🏗️ Структура админ-панели

### Главный компонент: AdminPanel.tsx

**Файл:** [components/AdminPanel.tsx](../components/AdminPanel.tsx)

**5 разделов (sub-views):**

| Sub-view | Компонент | Описание |
|----------|-----------|----------|
| `overview` | AdminPanel (встроенный) | Общая статистика системы |
| `users` | UserManagement.tsx | Управление пользователями |
| `providers` | AIProviders.tsx | Управление AI провайдерами и моделями |
| `analytics` | AdminAnalytics.tsx | Аналитика использования системы |
| `audit` | AuditLog.tsx | Журнал действий администраторов |

**Навигация:**

```typescript
const [adminSubView, setAdminSubView] = useState<string>('overview');
```

---

## 📊 Overview (Общая статистика)

**Отображает:**
- Общее количество пользователей
- Количество администраторов
- Общее количество снов
- Количество анализов за последние 30 дней

**Источники данных:**

```typescript
// Пользователи
const { count: totalUsers } = await supabase
  .from('auth.users')
  .select('*', { count: 'exact', head: true });

// Администраторы
const { count: totalAdmins } = await supabase
  .from('admin_users')
  .select('*', { count: 'exact', head: true });

// Сны
const { count: totalDreams } = await supabase
  .from('dream_entries')
  .select('*', { count: 'exact', head: true });

// Анализы за 30 дней
const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
const { count: recentAnalyses } = await supabase
  .from('analysis_metadata')
  .select('*', { count: 'exact', head: true })
  .gte('timestamp', thirtyDaysAgo);
```

---

## 👥 User Management (Управление пользователями)

**Компонент:** [components/UserManagement.tsx](../components/UserManagement.tsx)

### Функции

| Функция | Описание |
|---------|----------|
| Список пользователей | Таблица со всеми пользователями |
| Поиск | По email, имени |
| Фильтрация | По роли (user/admin) |
| Просмотр профиля | Детальная информация (UserDetail.tsx) |
| Управление ролями | Назначить/снять роль admin |
| Управление балансом | Пополнить/списать баланс |
| Удаление пользователя | С подтверждением |

### adminService функции

**Файл:** [services/adminService.ts](../services/adminService.ts)

```typescript
// Получить всех пользователей
export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  // Загрузить дополнительные данные профилей
  const usersWithProfiles = await Promise.all(
    data.users.map(async (user) => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return { ...user, ...profile };
    })
  );

  return usersWithProfiles;
};

// Удалить пользователя
export const deleteUser = async (userId: string): Promise<void> => {
  // Логировать действие
  await logAdminAction({
    action_type: 'USER_DELETED',
    target_user_id: userId,
    details: { reason: 'Admin action' }
  });

  // Удалить пользователя (CASCADE удалит все связанные записи)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
};

// Назначить роль admin
export const promoteToAdmin = async (userId: string): Promise<void> => {
  await supabase.from('admin_users').insert({ user_id: userId });

  await logAdminAction({
    action_type: 'USER_ROLE_CHANGED',
    target_user_id: userId,
    details: { role: 'admin' }
  });
};

// Снять роль admin
export const demoteFromAdmin = async (userId: string): Promise<void> => {
  await supabase.from('admin_users').delete().eq('user_id', userId);

  await logAdminAction({
    action_type: 'USER_ROLE_CHANGED',
    target_user_id: userId,
    details: { role: 'user' }
  });
};

// Изменить баланс
export const updateUserBalance = async (
  userId: string,
  amount: number,
  type: 'credit' | 'debit',
  description: string
): Promise<void> => {
  // Получить текущий баланс
  const { data: balance } = await supabase
    .from('user_balances')
    .select('balance')
    .eq('user_id', userId)
    .single();

  const oldBalance = balance?.balance || 0;
  const newBalance = type === 'credit'
    ? oldBalance + amount
    : oldBalance - amount;

  // Обновить баланс
  await supabase.from('user_balances').upsert({
    user_id: userId,
    balance: newBalance,
    updated_at: new Date().toISOString()
  });

  // Создать транзакцию
  await supabase.from('transactions').insert({
    user_id: userId,
    type: type === 'credit' ? 'manual_credit' : 'manual_debit',
    amount: amount,
    balance_before: oldBalance,
    balance_after: newBalance,
    status: 'success',
    description: description,
    admin_id: (await getCurrentUser())?.id
  });

  // Логировать
  await logAdminAction({
    action_type: type === 'credit' ? 'BALANCE_CREDITED' : 'BALANCE_DEBITED',
    target_user_id: userId,
    details: { amount, description }
  });
};
```

---

## 🤖 AI Providers (Управление провайдерами)

**Компонент:** [components/AIProviders.tsx](../components/AIProviders.tsx)

### Функции

| Функция | Описание |
|---------|----------|
| Список провайдеров | Все подключённые AI провайдеры |
| Активация/деактивация | Для text и image задач раздельно |
| Выбор модели | Модель по умолчанию для text и image |
| Управление моделями | CRUD операции с моделями |
| Фильтрация моделей | По провайдеру, capabilities |
| Сортировка | По имени, цене, производительности |

### Структура данных

См. [AI_PROVIDERS.md](AI_PROVIDERS.md) и [DATABASE.md](DATABASE.md#ai_provider_configs) для детальной информации.

**Ключевые поля:**
- `is_active_for_text` - активен для анализа снов
- `is_active_for_images` - активен для генерации изображений
- `default_model_id_for_text` - модель для текста
- `default_model_id_for_images` - модель для изображений

### Пример: активация провайдера

```typescript
// Активировать OpenAI для текстовых задач
await supabase.from('ai_provider_configs')
  .update({
    is_active_for_text: true,
    default_model_id_for_text: 'model-uuid-here'
  })
  .eq('provider_type', 'openai');

// Деактивировать других провайдеров для текста
await supabase.from('ai_provider_configs')
  .update({ is_active_for_text: false })
  .neq('provider_type', 'openai');

// Логировать
await logAdminAction({
  action_type: 'PROVIDER_CHANGED',
  details: {
    provider: 'openai',
    task_type: 'text',
    active: true
  }
});
```

---

## 📈 Admin Analytics (Аналитика системы)

**Компонент:** [components/AdminAnalytics.tsx](../components/AdminAnalytics.tsx)

### Графики и метрики

| Метрика | Описание | Источник |
|---------|----------|----------|
| Активность пользователей | Анализы по дням | `analysis_metadata` |
| Популярные методы | Распределение по PsychMethod | `analysis_metadata` |
| Успешность AI запросов | Процент успешных/неудачных | `usage_metrics` |
| Время суток | Когда пользователи анализируют сны | `analysis_metadata.timestamp` |
| Дни недели | Распределение по дням | `analysis_metadata.timestamp` |
| Средняя длина снов | Статистика по описаниям | `dream_entries.dream_data` |

### Периоды

```typescript
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'year' | 'all';
```

Пользователь может выбрать период для анализа данных.

---

## 📜 Audit Log (Журнал действий)

**Компонент:** [components/AuditLog.tsx](../components/AuditLog.tsx)

### Отслеживаемые действия

**Enum:** [types.ts](../types.ts:88-97)

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

### Структура записи

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

### Пример записи

```json
{
  "id": "uuid",
  "admin_id": "admin-uuid",
  "action_type": "BALANCE_CREDITED",
  "target_user_id": "user-uuid",
  "details": {
    "amount": 1000,
    "currency": "RUB",
    "description": "Промо-акция"
  },
  "ip_address": "192.168.1.100",
  "created_at": "2024-11-29T10:42:47.890Z"
}
```

### Логирование действия

```typescript
export const logAdminAction = async (
  action: Omit<AuditLogEntry, 'id' | 'admin_id' | 'created_at' | 'ip_address'>
): Promise<void> => {
  const admin = await getCurrentUser();
  if (!admin) throw new Error('Not authenticated');

  // TODO: Получить IP адрес (требует серверного endpoint)
  const ip_address = 'unknown';

  await supabase.from('admin_audit_log').insert({
    admin_id: admin.id,
    action_type: action.action_type,
    target_user_id: action.target_user_id,
    details: action.details,
    ip_address: ip_address
  });
};
```

---

## 🔒 Права доступа

### Проверка роли администратора

**В App.tsx:**

```typescript
const navigateTo = (newView: AppView) => {
  if (newView === 'admin') {
    if (!user) {
      setIntendedView('admin');
      setView('auth');
      return;
    }

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
};
```

### RLS политики

Все таблицы для админов имеют политики:

```sql
CREATE POLICY "Only admins can access"
  ON table_name FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));
```

---

## 📚 Связанные документы

- [DATABASE.md](DATABASE.md) - Таблицы admin_users, admin_audit_log, user_balances, transactions
- [AI_PROVIDERS.md](AI_PROVIDERS.md) - Управление AI провайдерами
- [AUTHENTICATION.md](AUTHENTICATION.md) - Роли и права доступа
- [ARCHITECTURE.md](ARCHITECTURE.md) - Структура админ-панели
- [CLAUDE.md](../CLAUDE.md) - Главный индекс
