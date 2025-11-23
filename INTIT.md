# Mindscape: Проектная документация v2.0

## 1. Обзор проекта
**Mindscape** — это прогрессивное веб-приложение (SPA) для психологического анализа сновидений. Проект сочетает в себе мастер толкования (Wizard) и полноценный личный кабинет пользователя для отслеживания динамики подсознания.

**Ключевая особенность:** Использование двухэтапного анализа через Google Gemini API для обхода ограничений токенов и генерации глубоких, объемных интерпретаций, основанных на научных методах (Юнг, Фрейд, Гештальт, КПТ, Экзистенциализм).

---

## 2. Технологический стек

### Core
*   **React 19**: Основной фреймворк.
*   **TypeScript**: Строгая типизация всех структур данных (`types.ts`).
*   **Vite / ES Modules**: Работа в браузере через `importmap` и CDN (без локальной сборки в текущей среде).

### UI/UX
*   **Tailwind CSS**: Стилизация.
*   **Design System "Midnight Glass"**:
    *   Фон: `Slate-950` (Deep Space).
    *   Эффекты: Glassmorphism (`backdrop-blur`), неоновые свечения (`box-shadow`), градиенты.
    *   **Starfield**: Интерактивный Canvas-фон с 3D-полем звезд.
    *   **TiltCard**: Компонент-обертка для карточек (стилизация рамок и фона).
*   **Icons**: `lucide-react`.
*   **Charts**: Кастомные SVG-графики (без тяжелых библиотек) для высокой производительности.

### Data & AI
*   **Google GenAI SDK**: Взаимодействие с Gemini 3.0 Pro Preview и Flash.
*   **LocalStorage**: Персистентное хранение данных пользователя (Журнал, Настройки).

---

## 3. Архитектура и Структура файлов

```text
/
├── index.html              # Entry point, Global CSS animations
├── App.tsx                 # Main Router (Wizard vs Cabinet layouts)
├── types.ts                # Data Models (DreamContext, AnalysisResponse, AppView)
├── constants.ts            # Config (Methods, Emotions)
│
├── services/
│   ├── geminiService.ts    # AI Logic (2-Step Analysis, Prompt Engineering)
│   └── storageService.ts   # LocalStorage CRUD
│
├── components/
│   ├── Sidebar.tsx         # Боковое меню навигации (Adaptive)
│   ├── Dashboard.tsx       # Главная страница кабинета (Widgets)
│   ├── Analytics.tsx       # Графики и статистика (SVG Charts)
│   ├── Settings.tsx        # Управление данными и профилем
│   ├── DreamJournal.tsx    # Список записей (Filtering, Notes)
│   ├── AnalysisResult.tsx  # Отображение результата (Tabs, Accordions)
│   ├── DreamForm.tsx       # Шаг 1: Ввод сна
│   ├── ContextForm.tsx     # Шаг 2: Контекст (Extended fields)
│   ├── MethodSelector.tsx  # Шаг 3: Выбор метода
│   ├── StepIndicator.tsx   # Прогресс-бар
│   ├── TiltCard.tsx        # UI-wrapper
│   └── Starfield.tsx       # 3D Background
│
└── prompts/                # Документация промптов (md files)
```

---

## 4. Логика работы приложения

### 4.1. Навигация и Layout
Приложение имеет два основных режима отображения (`AppView`):

1.  **Wizard (Landing)**:
    *   Стартовая точка входа.
    *   Содержит хедер с ссылкой в Личный кабинет.
    *   Пошаговый процесс: Сон -> Контекст -> Метод -> Результат.
2.  **Cabinet (Dashboard)**:
    *   Макет с фиксированным **Sidebar** (слева).
    *   Адаптивность: На мобильных меню скрыто под "гамбургер", на планшетах/ПК (md+) открыто всегда.
    *   Разделы: Обзор, Журнал, Аналитика, Архетипы (WIP), Настройки.

### 4.2. AI Анализ (Two-Step Architecture)
Для решения проблемы обрыва генерации длинных текстов (JSON cutoff) реализована двухэтапная архитектура в `geminiService.ts`:

*   **Шаг 1 (Structure & Deep Dive):**
    *   Запрос к `gemini-3-pro-preview`.
    *   Генерация: `summary`, `analysis` (глубокий разбор ситуации), `advice` (список), `questions`.
    *   **Важно:** ИИ только *называет* символы (`symbol_names`), но не расшифровывает их здесь.
*   **Шаг 2 (Parallel Symbol Analysis):**
    *   Берется список символов из Шага 1.
    *   Для **каждого** символа отправляется отдельный параллельный запрос.
    *   Промпт требует большого объема (800+ знаков) и строго русского языка.
    *   Результаты мерджатся в итоговый объект.

### 4.3. Личный кабинет
*   **Dashboard**: Виджеты "Инсайт дня" (AI), "Уровень осознанности", статистика, кнопка быстрого старта.
*   **Analytics**:
    *   *Emotional Pulse*: SVG-график настроения.
    *   *Method Spectrum*: Распределение методов анализа.
    *   *Stats*: Карточки ключевых показателей.
*   **Settings**:
    *   Экспорт журнала в JSON.
    *   Полная очистка данных (Hard Reset).
    *   Управление UI (язык, уведомления - mock).

---

## 5. Структуры данных (Ключевые обновления)

### DreamContext
Расширенный контекст для более точного анализа:
```typescript
interface DreamContext {
  emotion: string;
  lifeSituation: string;
  associations: string;
  recurring: boolean;
  dayResidue: string;       // Дневной остаток (Фрейд)
  characterType: string;    // Типаж персонажей (прошлое/настоящее)
  dreamRole: string;        // Роль (Наблюдатель/Герой)
  physicalSensation: string;// Психосоматика
}
```

### AnalysisResponse
Структура ответа от ИИ:
```typescript
interface AnalysisResponse {
  summary: string;
  symbolism: DreamSymbol[]; // { name, meaning }
  analysis: string;         // Markdown text
  advice: string[];         // Массив конкретных рекомендаций
  questions: string[];
}
```

---

## 6. Особенности Дизайна

*   **Типографика**: Строго регламентированные размеры шрифтов (17px для полей/заголовков на десктопе) для читабельности.
*   **Спойлеры**: Во вкладке "Символизм" используется Accordion UI с непрозрачными, контрастными плашками (Indigo/Slate theme).
*   **Компактность**: Dashboard Hero-секция оптимизирована по высоте, убраны лишние отступы.
*   **Атмосфера**: 3D-звезды (`Starfield`) + Анимированные фоновые пятна создают эффект глубины ("Mindscape").