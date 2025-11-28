🧠 ГЛУБОКИЙ АНАЛИЗ: СИСТЕМА УПРАВЛЕНИЯ AI ПРОВАЙДЕРАМИ
📊 ИТОГОВАЯ АРХИТЕКТУРА
┌─────────────────────────────────────────┐
│      UI Layer - Admin Panel             │
│   AIProviders.tsx - управление          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Service Layer - aiService.ts        │
│  Singleton, загрузка активного провайдера│
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Provider Factory - AIProviderFactory   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   Adapters (Adapter Pattern)            │
│ • GeminiProvider                         │
│ • OpenAIProvider (OpenAI/AiTunnel/NeuroAPI) │
│ • ClaudeProvider                         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│        External AI APIs                 │
└─────────────────────────────────────────┘
🎯 КЛЮЧЕВЫЕ РЕШЕНИЯ
1. Безопасность API ключей
Решение (MVP): Хранение в .env файлах (текущий подход)
VITE_AITUNNEL_KEY - для AiTunnel
VITE_NEUROAPI_KEY - для NeuroAPI
VITE_OPENAI_KEY - для OpenAI Direct
VITE_CLAUDE_KEY - для Claude
Будущее: Миграция на Supabase Edge Functions + Vault
2. Универсальный OpenAI Provider
Открытие: AiTunnel и NeuroAPI используют OpenAI-совместимый API! Это означает, что ОДИН адаптер OpenAIProvider может работать с ТРЕМЯ провайдерами:
OpenAI Direct (baseURL: https://api.openai.com/v1)
AiTunnel (baseURL: https://api.aitunnel.ru/v1/)
NeuroAPI (baseURL: https://neuroapi.host/v1)
Экономия: Не нужно писать отдельные адаптеры для каждого!
3. Стратегия миграции
Подход: Параллельная система без breaking changes
Создать новый aiService.ts БЕЗ изменения geminiService.ts
Добавить UI в админ-панели
Протестировать
Постепенно заменить импорты
📋 ДЕТАЛЬНЫЙ ПЛАН РЕАЛИЗАЦИИ
ЭТАП 1: БАЗА ДАННЫХ (2-3 часа)
Шаг 1.1: Создать таблицы
Файл: supabase/migrations/create_ai_providers.sql
-- Таблица конфигураций провайдеров
CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('gemini', 'openai', 'claude', 'aitunnel', 'neuroapi', 'custom')),
  provider_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  api_key_env_name TEXT, -- Имя переменной окружения
  base_url TEXT,
  default_model_id UUID,
  config JSONB DEFAULT '{}', -- {temperature, max_tokens, etc}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_type)
);

-- Таблица моделей
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_type TEXT NOT NULL,
  model_id TEXT NOT NULL, -- 'gpt-5-mini', 'claude-sonnet-4-5'
  model_name TEXT NOT NULL,
  provider_name TEXT, -- 'OpenAI', 'Anthropic', 'Google'
  capabilities JSONB DEFAULT '{"text": true, "image": false, "reasoning": false}',
  pricing JSONB DEFAULT '{"input": 0, "output": 0, "currency": "USD", "per": "1M tokens"}',
  performance JSONB DEFAULT '{"intelligence": "medium", "speed": "medium"}',
  context_length INTEGER DEFAULT 128000,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_type, model_id)
);

-- RLS Policies
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage provider configs"
  ON ai_provider_configs FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage models"
  ON ai_models FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
Шаг 1.2: Seed данные (20 популярных моделей)
Файл: supabase/migrations/seed_ai_providers.sql TOP-5 для AiTunnel (рубли):
gpt-5-nano - ₽0.9/₽72 (самая дешевая)
gpt-5-mini - ₽4.5/₽360 (оптимальная)
gpt-5 - ₽22.5/₽1800 (премиум)
claude-sonnet-4.5 - ₽540/₽2700 (топ качество)
deepseek-r1-0528 - ₽90/₽392.4 (reasoning)
TOP-5 для NeuroAPI (доллары):
gpt-5-nano - $0.04/$0.35 (ultra дешевая!)
gpt-5-mini - $0.22/$1.73
gpt-5 - $1.12/$8.96
claude-sonnet-4-5-20250929 - $3.12/$15.60
gemini-2.5-flash - $0.24/$2.00
ЭТАП 2: ТИПЫ TYPESCRIPT (1 час)
Файл: types.ts
// AI Provider Types
export type AIProviderType = 'gemini' | 'openai' | 'claude' | 'aitunnel' | 'neuroapi' | 'custom';

export interface AIProviderConfig {
  id: string;
  provider_type: AIProviderType;
  provider_name: string;
  is_active: boolean;
  api_key_env_name?: string;
  base_url?: string;
  default_model_id?: string;
  config: {
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface AIModel {
  id: string;
  provider_type: AIProviderType;
  model_id: string;
  model_name: string;
  provider_name?: string;
  capabilities: {
    text: boolean;
    image: boolean;
    reasoning: boolean;
  };
  pricing: {
    input: number;
    output: number;
    currency: string; // 'USD', 'RUB'
    per: string; // '1M tokens'
  };
  performance: {
    intelligence: 'low' | 'medium' | 'high' | 'highest';
    speed: 'slow' | 'medium' | 'fast' | 'fastest';
  };
  context_length: number;
  is_available: boolean;
  created_at: string;
}
ЭТАП 3: УСТАНОВКА ЗАВИСИМОСТЕЙ (15 мин)
npm install openai @anthropic-ai/sdk
ЭТАП 4: АРХИТЕКТУРА АДАПТЕРОВ (4-5 часов)
Файловая структура:
services/
  ai/
    providers/
      BaseProvider.ts
      GeminiProvider.ts
      OpenAIProvider.ts       # Универсальный для OpenAI/AiTunnel/NeuroAPI!
      ClaudeProvider.ts
    AIProviderFactory.ts
    aiService.ts              # Главный сервис
  prompts/
    dreamAnalysisPrompts.ts   # Промпт-шаблоны
BaseProvider.ts (абстрактный класс):
import type { DreamData, AnalysisResponse, AIProviderConfig, AIModel } from '../../types';

export abstract class BaseProvider {
  protected config: AIProviderConfig;
  protected model: AIModel;
  
  constructor(config: AIProviderConfig, model: AIModel) {
    this.config = config;
    this.model = model;
  }
  
  // Абстрактные методы (реализуют наследники)
  abstract analyzeDream(dreamData: DreamData): Promise<AnalysisResponse>;
  abstract generateImage(prompt: string): Promise<string>;
  
  // Общие методы
  protected getApiKey(): string {
    const envName = this.config.api_key_env_name || 'VITE_API_KEY';
    return import.meta.env[envName] || '';
  }
  
  protected buildPrompt(dreamData: DreamData): string {
    // Строит промпт из шаблона
  }
  
  protected validateResponse(response: any): AnalysisResponse {
    // Валидация и нормализация ответа
  }
}
OpenAIProvider.ts (универсальный!):
import OpenAI from 'openai';
import { BaseProvider } from './BaseProvider';

export class OpenAIProvider extends BaseProvider {
  private client: OpenAI;
  
  constructor(config: AIProviderConfig, model: AIModel) {
    super(config, model);
    
    // Автоматически выбирает baseURL в зависимости от провайдера!
    this.client = new OpenAI({
      apiKey: this.getApiKey(),
      baseURL: config.base_url || 'https://api.openai.com/v1'
    });
  }
  
  async analyzeDream(dreamData: DreamData): Promise<AnalysisResponse> {
    const prompt = this.buildPrompt(dreamData);
    
    const completion = await this.client.chat.completions.create({
      model: this.model.model_id,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: this.config.config.temperature || 0.7,
      max_tokens: this.config.config.max_tokens || 4096
    });
    
    const responseText = completion.choices[0]?.message?.content || '{}';
    return this.validateResponse(JSON.parse(responseText));
  }
  
  async generateImage(prompt: string): Promise<string> {
    // Реализация генерации изображений
  }
}
AIProviderFactory.ts:
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { ClaudeProvider } from './providers/ClaudeProvider';
import type { AIProviderConfig, AIModel } from '../types';

export class AIProviderFactory {
  static create(config: AIProviderConfig, model: AIModel): BaseProvider {
    switch (config.provider_type) {
      case 'gemini':
        return new GeminiProvider(config, model);
      
      case 'openai':
      case 'aitunnel':
      case 'neuroapi':
        // Все три используют OpenAIProvider!
        return new OpenAIProvider(config, model);
      
      case 'claude':
        return new ClaudeProvider(config, model);
      
      default:
        throw new Error(`Unknown provider: ${config.provider_type}`);
    }
  }
}
ЭТАП 5: ГЛАВНЫЙ СЕРВИС aiService.ts (2 часа)
import { supabase } from '../supabaseClient';
import { AIProviderFactory } from './ai/AIProviderFactory';
import type { DreamData, AnalysisResponse } from '../types';

class AIService {
  private static instance: AIService;
  private currentProvider: BaseProvider | null = null;
  
  private constructor() {}
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }
  
  private async loadActiveProvider(): Promise<BaseProvider> {
    // Получить активную конфигурацию
    const { data: activeConfig } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (!activeConfig) throw new Error('No active AI provider');
    
    // Получить активную модель
    const { data: activeModel } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', activeConfig.default_model_id)
      .single();
    
    if (!activeModel) throw new Error('No active model');
    
    // Создать провайдера
    return AIProviderFactory.create(activeConfig, activeModel);
  }
  
  async analyzeDream(dreamData: DreamData): Promise<AnalysisResponse> {
    const provider = await this.loadActiveProvider();
    return provider.analyzeDream(dreamData);
  }
  
  async generateImage(prompt: string): Promise<string> {
    const provider = await this.loadActiveProvider();
    return provider.generateImage(prompt);
  }
}

export const aiService = AIService.getInstance();

// Экспорт для обратной совместимости
export const analyzeDream = (dreamData: DreamData) => aiService.analyzeDream(dreamData);
export const generateImage = (prompt: string) => aiService.generateImage(prompt);
ЭТАП 6: ADMIN SERVICE (2 часа)
Добавить в services/adminService.ts:
// AI Provider Management Functions
export const getAllProviders = async (): Promise<AIProviderConfig[]> => { ... };
export const getActiveProvider = async (): Promise<AIProviderConfig | null> => { ... };
export const getModelsForProvider = async (providerType: AIProviderType): Promise<AIModel[]> => { ... };
export const updateProviderConfig = async (providerId: string, updates: Partial<AIProviderConfig>) => { ... };
export const setActiveProvider = async (providerId: string) => { ... };
export const testProviderConnection = async (providerId: string) => { ... };
ЭТАП 7: UI КОМПОНЕНТ AIProviders.tsx (4-5 часов)
Структура:
Список провайдеров (карточки)
Модальное окно настройки
Поле API ключа (скрытое)
Выбор модели из списка
Группировка моделей по семействам
Отображение цен и характеристик
Тестирование подключения
Активация провайдера
Основные функции:
Загрузка списка провайдеров
Открытие модального окна настройки
Загрузка моделей для провайдера
Сохранение конфигурации
Активация провайдера
Тест подключения
ЭТАП 8: ИНТЕГРАЦИЯ В ADMINPANEL (30 мин)
// AdminPanel.tsx
import AIProviders from './AIProviders';

// Добавить тип view
type AdminView = 'overview' | 'users' | 'analytics' | 'audit' | 'ai-providers';

// Добавить роутинг
if (currentView === 'ai-providers') {
  return <AIProviders onBack={handleBackToOverview} />;
}

// Добавить кнопку в обзоре
<button onClick={() => setCurrentView('ai-providers')}>
  AI Провайдеры
</button>
⚠️ КРИТИЧЕСКИЕ РИСКИ
Риск	Вероятность	Решение
Различия в форматах ответов	Высокая	Строгая валидация в validateResponse()
Стоимость тестирования	Средняя	Использовать самые дешевые модели
Rate limits	Средняя	Retry logic с exponential backoff
API ключи в .env (небезопасно)	Высокая	MVP: .env, V2: Edge Functions
Сломать анализ снов	Средняя	Параллельная система, тестирование
Производительность (запросы к БД)	Низкая	Кэширование провайдера
📊 ОЦЕНКА ВРЕМЕНИ
Этап	Время
База данных + Seed данные	2-3 часа
Типы TypeScript	1 час
Установка зависимостей	15 мин
Архитектура адаптеров	4-5 часов
Главный сервис	2 часа
Admin Service	2 часа
UI компонент	4-5 часов
Интеграция + Тестирование	3-4 часа
ИТОГО MVP	18-23 часа
🎯 РЕКОМЕНДАЦИЯ
Подход: ИТЕРАТИВНАЯ РАЗРАБОТКА Итерация 1 (5-6 часов): БД + Типы + Базовая архитектура Итерация 2 (4-5 часов): OpenAIProvider + AiTunnelProvider Итерация 3 (3-4 часа): Admin Service + базовый UI Итерация 4 (3-4 часа): Полный UI с модалками Итерация 5 (2-3 часа): Тестирование + багфиксы Приоритеты:
✅ AiTunnel (самый популярный посредник)
✅ NeuroAPI
⭕ Claude (опционально)
⭕ OpenAI Direct (опционально)
✅ ГОТОВ К РЕАЛИЗАЦИИ!
План создан с учетом всех рисков и оптимизирован для минимизации ошибок. Начинаем с Этапа 1? Я могу сразу создать SQL миграции и seed скрипты.