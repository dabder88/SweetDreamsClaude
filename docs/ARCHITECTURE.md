# ARCHITECTURE - Архитектура приложения

> **Summary:** PsyDream - это React + TypeScript SPA с Vite, использующее view-based маршрутизацию (без React Router), централизованное управление состоянием через `App.tsx`, и гибридное хранилище (Supabase + localStorage).

---

## ⚠️ ВАЖНО: Обновление документации

После изменений в архитектуре **ОБЯЗАТЕЛЬНО** обновляй этот файл и [CLAUDE.md](../CLAUDE.md).

**Что требует обновления:**
- Добавление/удаление views
- Изменения в системе маршрутизации
- Новые state переменные в App.tsx
- Изменения в layout'ах (sidebar, header, footer)
- Новые глобальные компоненты

---

## 📁 Структура проекта

```
/
├── App.tsx                      # Главный компонент, роутинг, state
├── index.tsx                    # Точка входа
├── types.ts                     # TypeScript типы и enum'ы
├── constants.ts                 # Константы (методы психоанализа, эмоции)
├── /components                  # React компоненты
│   ├── LandingPage.tsx          # Главная страница
│   ├── Auth.tsx                 # Логин/регистрация
│   ├── Dashboard.tsx            # Личный кабинет
│   ├── DreamJournal.tsx         # Журнал снов
│   ├── Analytics.tsx            # Аналитика пользователя
│   ├── Settings.tsx             # Настройки профиля
│   ├── Archetypes.tsx           # Анализ архетипов
│   ├── AdminPanel.tsx           # Админ-панель
│   ├── DreamForm.tsx            # Wizard Step 1
│   ├── ContextForm.tsx          # Wizard Step 2
│   ├── MethodSelector.tsx       # Wizard Step 3
│   ├── AnalysisResult.tsx       # Wizard Step 4
│   ├── DreamView.tsx            # Просмотр отдельного сна
│   ├── Sidebar.tsx              # Боковое меню
│   ├── Starfield.tsx            # Фоновая анимация
│   └── ...                      # UI компоненты (Button, TiltCard, etc.)
├── /services                    # Бизнес-логика
│   ├── /ai                      # AI провайдеры
│   │   ├── aiService.ts         # Главный AI сервис (Singleton)
│   │   ├── AIProviderFactory.ts # Фабрика провайдеров
│   │   └── /providers           # Конкретные провайдеры
│   ├── authService.ts           # Аутентификация
│   ├── adminService.ts          # Админ-функции
│   ├── supabaseStorageService.ts # Работа с Supabase
│   ├── storageService.ts        # localStorage fallback
│   ├── statsService.ts          # Статистика пользователя
│   └── ...
├── /constants                   # Дополнительные константы
│   ├── archetypes.ts            # 12 юнгианских архетипов
│   └── achievements.ts          # Достижения (если используется)
├── /supabase/migrations         # SQL миграции
├── /public                      # Статические файлы
└── /docs                        # Документация
```

---

## 🧭 Система маршрутизации

### View-Based Routing (без React Router)

PsyDream **НЕ использует** React Router. Вместо этого используется **view-based система** с enum `AppView`.

**Файл:** [types.ts](../types.ts:82)

```typescript
export type AppView =
  | 'landing'      // Главная страница
  | 'auth'         // Логин/регистрация
  | 'wizard'       // Wizard анализа снов (4 шага)
  | 'dashboard'    // Личный кабинет
  | 'journal'      // Журнал снов
  | 'dreamView'    // Просмотр отдельного сна
  | 'analytics'    // Аналитика пользователя
  | 'archetypes'   // Анализ архетипов
  | 'settings'     // Настройки профиля
  | 'admin';       // Админ-панель
```

### Навигация через navigateTo()

**Файл:** [App.tsx](../App.tsx) (около строки 100-150)

```typescript
const navigateTo = (newView: AppView) => {
  // Проверка авторизации для защищённых routes
  const privateViews: AppView[] = ['dashboard', 'journal', 'analytics', 'archetypes', 'settings', 'admin', 'dreamView'];

  if (privateViews.includes(newView) && !user && isSupabaseConfigured()) {
    setIntendedView(newView); // Запомнить куда хотел перейти
    setView('auth'); // Редирект на логин
    return;
  }

  setView(newView);
  setMobileMenuOpen(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

### Защищённые vs Публичные Routes

| View | Защищён | Описание |
|------|---------|----------|
| `landing` | ❌ | Главная страница |
| `auth` | ❌ | Логин/регистрация |
| `wizard` | ❌ | Wizard анализа снов (доступен без логина) |
| `dashboard` | ✅ | Личный кабинет |
| `journal` | ✅ | Журнал снов |
| `dreamView` | ✅ | Просмотр отдельного сна |
| `analytics` | ✅ | Аналитика пользователя |
| `archetypes` | ✅ | Анализ архетипов |
| `settings` | ✅ | Настройки профиля |
| `admin` | ✅ | Админ-панель (требует admin роль) |

---

## 📦 Управление состоянием

### Централизованный State в App.tsx

PsyDream **НЕ использует** Redux, Zustand или другие state management библиотеки. Всё состояние находится в `App.tsx` через `useState`.

**Основные state переменные:**

```typescript
// Текущая страница
const [view, setView] = useState<AppView>('landing');

// Wizard состояние
const [step, setStep] = useState(1); // 1-4
const [dreamData, setDreamData] = useState<DreamData>(INITIAL_DATA);
const [analysisComplete, setAnalysisComplete] = useState(false);
const [isSaved, setIsSaved] = useState(false);
const [currentAnalysisResult, setCurrentAnalysisResult] = useState<any>(null);
const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

// UI состояние
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const [showExitWarning, setShowExitWarning] = useState(false);

// Аутентификация
const [user, setUser] = useState<User | null>(null);
const [authLoading, setAuthLoading] = useState(true);
const [intendedView, setIntendedView] = useState<AppView | null>(null);

// Просмотр отдельного сна
const [selectedDream, setSelectedDream] = useState<JournalEntry | null>(null);

// Админ-панель
const [adminSubView, setAdminSubView] = useState<string>('overview');
```

### Передача данных компонентам

Все компоненты получают данные и callback'и через **props**:

```typescript
<Dashboard
  user={user}
  navigateTo={navigateTo}
  setSelectedDream={setSelectedDream}
/>
```

---

## 🎨 Layout System

### 1. Landing Layout (без sidebar)

**Используется для:** `landing`, `auth`

```typescript
if (view === 'landing') {
  return (
    <div className="min-h-screen bg-[#0a0118]">
      <Starfield />
      <LandingPage navigateTo={navigateTo} />
    </div>
  );
}
```

### 2. Cabinet Layout (с sidebar)

**Используется для:** `dashboard`, `journal`, `analytics`, `settings`, `archetypes`, `admin`, `dreamView`

```typescript
return (
  <div className="min-h-screen bg-[#0a0118] flex">
    <Starfield />
    <Sidebar
      currentView={view}
      navigateTo={navigateTo}
      user={user}
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
    />
    <main className="flex-1 ml-0 md:ml-64">
      {renderCabinetContent()}
    </main>
  </div>
);
```

### 3. Wizard Layout (полноэкранный)

**Используется для:** `wizard`

```typescript
return (
  <div className="min-h-screen bg-[#0a0118]">
    <Starfield />
    <div className="relative z-10 p-6">
      <StepIndicator currentStep={step} totalSteps={4} />
      {renderWizardStep()}
    </div>
  </div>
);
```

---

## 🔄 Wizard Flow (анализ снов)

### 4 шага Wizard'a

**Файл:** [App.tsx](../App.tsx) (renderWizardStep function)

1. **Step 1 - DreamForm:** Описание сна (textarea)
2. **Step 2 - ContextForm:** Контекст (8 полей: emotion, lifeSituation, associations, recurring, dayResidue, characterType, dreamRole, physicalSensation)
3. **Step 3 - MethodSelector:** Выбор метода психоанализа (AUTO, JUNGIAN, FREUDIAN, GESTALT, COGNITIVE, EXISTENTIAL)
4. **Step 4 - AnalysisResult:** Результаты анализа (summary, analysis, symbolism, advice, questions, image)

### Переход между шагами

```typescript
// Вперёд
const handleNext = () => {
  if (step < 4) setStep(step + 1);
};

// Назад
const handleBack = () => {
  if (step > 1) setStep(step - 1);
};

// Выход с предупреждением
const handleExit = () => {
  if (!isSaved && analysisComplete) {
    setShowExitWarning(true);
  } else {
    resetWizard();
    navigateTo('dashboard');
  }
};
```

---

## 🔐 Аутентификация

### Проверка при монтировании

**Файл:** [App.tsx](../App.tsx) (useEffect)

```typescript
useEffect(() => {
  const checkAuth = async () => {
    if (isSupabaseConfigured()) {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Миграция localStorage → Supabase
        if (currentUser) {
          migrateLocalEntriesToSupabase();
        }
      } catch (err) {
        console.warn('Auth check failed:', err);
      }
    }
    setAuthLoading(false);
  };

  checkAuth();

  // Подписка на изменения auth state
  if (isSupabaseConfigured()) {
    const { data: authListener } = onAuthStateChange((newUser) => {
      setUser(newUser);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }
}, []);
```

### Редирект после логина

После успешного логина пользователь переходит к `intendedView` (если была попытка зайти на защищённую страницу) или в `dashboard`.

```typescript
// В Auth.tsx после успешного логина
if (intendedView) {
  navigateTo(intendedView);
  setIntendedView(null);
} else {
  navigateTo('dashboard');
}
```

---

## 📊 Поток данных

### Анализ сна

```
User Input (DreamForm, ContextForm, MethodSelector)
  ↓
App.tsx: dreamData state
  ↓
AnalysisResult.tsx: aiService.analyzeDream(dreamData)
  ↓
AIService.getInstance().analyzeDream()
  ↓
loadActiveProvider('text') → GeminiProvider/OpenAIProvider/ClaudeProvider
  ↓
provider.analyzeDream() → Stage 1 + Stage 2
  ↓
AnalysisResponse (summary, analysis, symbolism, advice, questions)
  ↓
AnalysisResult.tsx: отображение результатов
```

### Генерация изображения

```
AnalysisResult.tsx: кнопка "Создать изображение"
  ↓
aiService.generateImage(prompt)
  ↓
loadActiveProvider('image') → GeminiProvider/OpenAIProvider
  ↓
provider.generateImage() → base64 data URL
  ↓
AnalysisResult.tsx: отображение изображения
```

### Сохранение в журнал

```
AnalysisResult.tsx: кнопка "Сохранить"
  ↓
supabaseStorageService.saveJournalEntry(entry)
  ↓
Supabase: INSERT into dream_entries table
  ↓
AnalysisResult.tsx: isSaved = true
```

---

## 🎯 Ключевые паттерны

### 1. Пропсы сверху вниз (Top-Down Props)

Все данные передаются от `App.tsx` к дочерним компонентам через props. Нет глобального state.

### 2. Callback'и для изменения state

Компоненты получают функции для изменения state родителя:

```typescript
<Dashboard
  navigateTo={navigateTo}
  setSelectedDream={setSelectedDream}
/>
```

### 3. Условный рендеринг по view

```typescript
const renderCabinetContent = () => {
  switch (view) {
    case 'dashboard':
      return <Dashboard ... />;
    case 'journal':
      return <DreamJournal ... />;
    case 'analytics':
      return <Analytics ... />;
    // ...
  }
};
```

### 4. Разделение UI и логики

- **Components:** Чистый UI (React компоненты)
- **Services:** Бизнес-логика (API calls, data transformations)
- **Types:** TypeScript интерфейсы и enum'ы
- **Constants:** Статические данные

---

## 📚 Связанные документы

- [DATABASE.md](DATABASE.md) - Схема БД и таблицы
- [AI_PROVIDERS.md](AI_PROVIDERS.md) - Система AI провайдеров
- [AUTHENTICATION.md](AUTHENTICATION.md) - Supabase Auth
- [DREAM_ANALYSIS.md](DREAM_ANALYSIS.md) - Wizard анализа снов
- [STORAGE.md](STORAGE.md) - Гибридное хранилище
- [UI_COMPONENTS.md](UI_COMPONENTS.md) - Справочник компонентов
- [CLAUDE.md](../CLAUDE.md) - Главный индекс
