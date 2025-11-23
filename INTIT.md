# PsyDream: Проектная документация v2.1

## 1. Обзор проекта
**PsyDream** (ранее Mindscape) — это прогрессивное веб-приложение (SPA) для глубокого психологического анализа сновидений. Проект эволюционировал из простого мастера толкования в полноценную платформу с личным кабинетом.

**Ключевая особенность:** Двухэтапный каскадный анализ через Google Gemini API, обеспечивающий генерацию больших объемов текста без обрывов, и безопасная архитектура подключения к API (Lazy Initialization).

---

## 2. Технологический стек

### Core & Build
*   **Vite**: Сборщик проекта (Framework Preset: Vite).
*   **React 19**: Основной фреймворк.
*   **TypeScript**: Строгая типизация данных.

### UI/UX
*   **Tailwind CSS**: Стилизация (в текущей версии через CDN для быстрого прототипирования).
*   **Design System "Midnight Glass"**:
    *   Фон: `Slate-950` (Deep Space).
    *   **PsyDream Branding**: Логотип (Луна + Искры), градиенты Индиго/Пурпур.
    *   **Starfield**: Интерактивный Canvas-фон с 3D-полетом сквозь звезды.
*   **Charts**: Легковесные SVG-графики в разделе Аналитики.

### Data & AI
*   **Google GenAI SDK**: 
    *   Текстовый анализ: **`gemini-2.5-flash`** (Выбрана для обхода лимитов Rate Limit бесплатного тарифа).
    *   Визуализация: **`gemini-2.0-flash-exp`** (Мультимодальная генерация изображений).
*   **LocalStorage**: Хранение журнала снов и настроек.

---

## 3. Архитектура и Структура файлов

```text
/
├── index.html              # Entry point (Vite script module)
├── App.tsx                 # Main Router & Layout Logic
├── types.ts                # Data Models
├── constants.ts            # Config (Methods, Emotions)
│
├── services/
│   ├── geminiService.ts    # AI Logic (Safe Env Access, Lazy Init, 2-Step Flow)
│   └── storageService.ts   # LocalStorage CRUD
│
├── components/
│   ├── LandingPage.tsx     # Стартовая страница (Hero)
│   ├── Sidebar.tsx         # Навигация кабинета (Mobile/Desktop adaptive)
│   ├── Dashboard.tsx       # Главная страница кабинета (Widgets)
│   ├── Analytics.tsx       # Графики (SVG)
│   ├── Settings.tsx        # Управление данными (Export JSON)
│   ├── DreamJournal.tsx    # Список записей (Accordions, Filtering)
│   ├── AnalysisResult.tsx  # Результат анализа (Tabs: Symbolism, Depth, Advice)
│   ├── DreamForm.tsx       # Ввод сна
│   ├── ContextForm.tsx     # Контекст (Extended fields)
│   ├── MethodSelector.tsx  # Выбор метода
│   ├── StepIndicator.tsx   # Прогресс-бар
│   └── Starfield.tsx       # 3D Background
│
└── prompts/                # Документация промптов (.md)
```

---

## 4. Логика работы приложения

### 4.1. Навигация
*   **Landing Page**: Точка входа. Логотип слева, ссылка на Кабинет справа.
*   **Wizard**: Процесс толкования (4 шага).
*   **Cabinet**: Защищенная зона (Dashboard, Journal, Analytics, Settings). Меню фиксировано слева на Desktop, скрыто на Mobile.

### 4.2. AI Анализ (Two-Step Architecture)
Для решения проблемы обрыва JSON и лимитов токенов:

1.  **Шаг 1 (Structure)**: Запрос к `gemini-2.5-flash`. Генерирует структуру, глубокий анализ (`analysis`), советы (`advice` как массив) и список символов.
2.  **Шаг 2 (Parallel Detail)**: Для каждого символа отправляется **отдельный параллельный запрос**. Это позволяет генерировать по 3-4 абзаца на символ без риска обрыва ответа.
3.  **Визуализация**: Отдельный запрос к `gemini-2.0-flash-exp` для генерации изображения по описанию сна.

### 4.3. Безопасность и Стабильность
*   **Lazy Initialization**: Инициализация `GoogleGenAI` происходит *внутри* функции вызова, а не глобально. Это предотвращает падение сайта ("Белый экран") при загрузке, если API ключ отсутствует или некорректен.
*   **Safe Env Access**: Функция `getApiKey` безопасно проверяет как `import.meta.env`, так и `process.env`.

---

## 5. Модели Данных

### DreamContext (Расширенный)
```typescript
interface DreamContext {
  emotion: string;
  lifeSituation: string;
  associations: string;
  recurring: boolean;
  dayResidue: string;        // Дневной остаток
  characterType: string;     // Типаж (из прошлого/настоящего)
  dreamRole: string;         // Роль (Наблюдатель/Герой)
  physicalSensation: string; // Психосоматика
}
```

### JournalEntry
```typescript
interface JournalEntry {
  id: string;
  timestamp: number;
  dreamData: DreamData;
  analysis: AnalysisResponse; 
  imageUrl?: string | null;  // Base64 изображение
  notes?: string;            // Пользовательские заметки
}
```

---

## 6. Особенности Дизайна

*   **PsyDream Brand**: Атмосфера "Полночь". Темно-синие тона (`Slate-950`), акценты `Indigo-500` и `Purple-500`.
*   **Типографика**: Шрифт `Lora` (Serif) для заголовков, `Inter` (Sans) для текста. Размеры шрифтов строго регламентированы (17px body).
*   **Спойлеры**: Непрозрачные, контрастные аккордеоны во вкладке "Символизм".
*   **Компактность**: Оптимизированные отступы в Dashboard для максимальной информационной плотности.