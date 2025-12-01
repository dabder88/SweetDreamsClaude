# UI_COMPONENTS - Справочник компонентов

> **Summary:** Каталог всех React компонентов PsyDream с описанием их назначения и основных props.

---

## ⚠️ ВАЖНО: Обновление документации

После добавления/изменения компонентов **ОБЯЗАТЕЛЬНО** обновляй этот файл и [CLAUDE.md](../CLAUDE.md).

---

## 📁 Структура /components

```
/components
├── LandingPage.tsx          # Главная страница
├── Auth.tsx                 # Логин/регистрация
├── Dashboard.tsx            # Личный кабинет
├── DreamJournal.tsx         # Журнал снов
├── DreamView.tsx            # Просмотр отдельного сна
├── Analytics.tsx            # Аналитика пользователя
├── Archetypes.tsx           # Анализ архетипов
├── Settings.tsx             # Настройки профиля
├── AdminPanel.tsx           # Админ-панель
├── UserManagement.tsx       # Управление пользователями
├── UserDetail.tsx           # Детальный профиль пользователя
├── AIProviders.tsx          # Управление AI провайдерами
├── AdminAnalytics.tsx       # Аналитика для админов
├── AuditLog.tsx             # Журнал действий администраторов
├── DreamForm.tsx            # Wizard Step 1
├── ContextForm.tsx          # Wizard Step 2
├── MethodSelector.tsx       # Wizard Step 3
├── AnalysisResult.tsx       # Wizard Step 4
├── StepIndicator.tsx        # Индикатор шагов wizard
├── Sidebar.tsx              # Боковое меню
├── Button.tsx               # Переиспользуемая кнопка
├── TiltCard.tsx             # Карточка с 3D эффектом
├── Starfield.tsx            # Фоновая анимация звёзд
├── Tooltip.tsx              # Всплывающая подсказка
├── TypewriterEffect.tsx     # Эффект печатающейся машинки
└── AvatarModal.tsx          # Модальное окно загрузки аватара
```

---

## 🏠 Страницы (Views)

### LandingPage.tsx

**Назначение:** Главная страница с презентацией приложения

**Props:**
```typescript
{
  navigateTo: (view: AppView) => void
}
```

### Auth.tsx

**Назначение:** Страница логина и регистрации

**Props:**
```typescript
{
  navigateTo: (view: AppView) => void,
  intendedView: AppView | null,
  setIntendedView: (view: AppView | null) => void
}
```

### Dashboard.tsx

**Назначение:** Личный кабинет с быстрыми действиями и недавними снами

**Props:**
```typescript
{
  user: User,
  navigateTo: (view: AppView) => void,
  setSelectedDream: (dream: JournalEntry) => void
}
```

**Функции:**
- Кнопка "Новый анализ" → wizard
- 3 последних сна с превью
- Статистика (всего снов, последний анализ)

### DreamJournal.tsx

**Назначение:** Список всех снов пользователя

**Props:**
```typescript
{
  user: User,
  navigateTo: (view: AppView) => void,
  setSelectedDream: (dream: JournalEntry) => void
}
```

**Функции:**
- Список снов (сортировка по дате)
- Поиск по описанию
- Фильтрация по методу, эмоции
- Клик по сну → DreamView

### DreamView.tsx

**Назначение:** Детальный просмотр отдельного сна

**Props:**
```typescript
{
  dream: JournalEntry,
  user: User,
  navigateTo: (view: AppView) => void
}
```

**Функции:**
- Отображение полного анализа
- Редактирование заметок
- Удаление сна
- Повторный анализ другим методом

### Analytics.tsx

**Назначение:** Статистика и аналитика снов пользователя

**Props:**
```typescript
{
  user: User
}
```

**Графики:**
- Частота снов по дням
- Популярные методы
- Эмоциональная динамика
- Частые символы

### Archetypes.tsx

**Назначение:** Юнгианский анализ архетипов на основе всех снов

**Props:**
```typescript
{
  user: User
}
```

**Функции:**
- Анализ 12 архетипов
- Визуализация профиля (radar chart)
- Детальное описание каждого архетипа
- Кнопка "Обновить профиль"

### Settings.tsx

**Назначение:** Настройки профиля пользователя

**Props:**
```typescript
{
  user: User,
  onUserUpdate: (updatedUser: User) => void
}
```

**Разделы:**
- Личная информация (имя, пол, дата рождения)
- Загрузка аватара
- Смена email/пароля
- Настройки приватности

---

## 🎨 Wizard Components

### DreamForm.tsx

**Step 1:** Описание сна

**Props:**
```typescript
{
  value: string,
  onChange: (value: string) => void,
  onNext: () => void
}
```

### ContextForm.tsx

**Step 2:** Контекст сна (8 полей)

**Props:**
```typescript
{
  context: DreamContext,
  onChange: (context: DreamContext) => void,
  onNext: () => void,
  onBack: () => void
}
```

### MethodSelector.tsx

**Step 3:** Выбор метода психоанализа

**Props:**
```typescript
{
  selectedMethod: PsychMethod,
  onSelect: (method: PsychMethod) => void,
  onNext: () => void,
  onBack: () => void
}
```

### AnalysisResult.tsx

**Step 4:** Результаты анализа

**Props:**
```typescript
{
  dreamData: DreamData,
  user: User | null,
  onSave: () => void,
  onExit: () => void,
  isSaved: boolean,
  setIsSaved: (saved: boolean) => void,
  analysisComplete: boolean,
  setAnalysisComplete: (complete: boolean) => void,
  currentAnalysisResult: AnalysisResponse | null,
  setCurrentAnalysisResult: (result: AnalysisResponse | null) => void,
  currentImageUrl: string | null,
  setCurrentImageUrl: (url: string | null) => void
}
```

**Функции:**
- AI анализ через aiService
- Генерация изображения
- Сохранение в журнал
- Выход с предупреждением (если не сохранено)

### StepIndicator.tsx

**Индикатор прогресса wizard**

**Props:**
```typescript
{
  currentStep: number,
  totalSteps: number
}
```

---

## 🔧 Admin Components

### AdminPanel.tsx

**Главный компонент админ-панели**

**Props:**
```typescript
{
  user: User,
  adminSubView: string,
  setAdminSubView: (view: string) => void
}
```

**Sub-views:** overview, users, providers, analytics, audit

### UserManagement.tsx

**Управление пользователями**

**Props:**
```typescript
{
  currentUser: User
}
```

### UserDetail.tsx

**Детальный профиль пользователя для админа**

**Props:**
```typescript
{
  user: User,
  onClose: () => void,
  onUserUpdated: () => void
}
```

### AIProviders.tsx

**Управление AI провайдерами и моделями**

**Props:**
```typescript
{
  currentUser: User
}
```

### AdminAnalytics.tsx

**Аналитика системы для администраторов**

**Props:**
```typescript
{
  currentUser: User
}
```

### AuditLog.tsx

**Журнал действий администраторов**

**Props:**
```typescript
{
  currentUser: User
}
```

---

## 🎨 UI Elements

### Sidebar.tsx

**Боковое меню навигации**

**Props:**
```typescript
{
  currentView: AppView,
  navigateTo: (view: AppView) => void,
  user: User | null,
  mobileMenuOpen: boolean,
  setMobileMenuOpen: (open: boolean) => void
}
```

### Button.tsx

**Универсальная кнопка**

**Props:**
```typescript
{
  children: React.ReactNode,
  onClick?: () => void,
  variant?: 'primary' | 'secondary' | 'danger',
  disabled?: boolean,
  className?: string
}
```

### TiltCard.tsx

**Карточка с 3D эффектом при наведении**

**Props:**
```typescript
{
  children: React.ReactNode,
  className?: string
}
```

### Starfield.tsx

**Фоновая анимация звёздного неба**

**Props:** Нет (фоновый эффект)

### Tooltip.tsx

**Всплывающая подсказка**

**Props:**
```typescript
{
  text: string,
  children: React.ReactNode,
  position?: 'top' | 'bottom' | 'left' | 'right'
}
```

### TypewriterEffect.tsx

**Эффект печатающейся машинки**

**Props:**
```typescript
{
  text: string,
  speed?: number
}
```

### AvatarModal.tsx

**Модальное окно загрузки/обрезки аватара**

**Props:**
```typescript
{
  user: User,
  isOpen: boolean,
  onClose: () => void,
  onAvatarUpdated: (newAvatarUrl: string) => void
}
```

---

## 📚 Связанные документы

- [ARCHITECTURE.md](ARCHITECTURE.md) - Структура приложения
- [DREAM_ANALYSIS.md](DREAM_ANALYSIS.md) - Wizard flow
- [ADMIN_PANEL.md](ADMIN_PANEL.md) - Админ-компоненты
- [CLAUDE.md](../CLAUDE.md) - Главный индекс
