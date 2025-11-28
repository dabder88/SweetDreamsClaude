/**
 * AIService - Main service for AI operations (Singleton)
 *
 * Responsibilities:
 * - Load active AI provider configuration from Supabase
 * - Create provider instances using AIProviderFactory
 * - Provide unified API for dream analysis and image generation
 * - Cache active provider to minimize database queries
 *
 * Usage:
 * import { aiService } from './services/ai/aiService';
 * const analysis = await aiService.analyzeDream(dreamData);
 * const image = await aiService.generateImage(prompt);
 */

import { supabase } from '../supabaseClient';
import { AIProviderFactory } from './AIProviderFactory';
import { BaseProvider } from './providers/BaseProvider';
import type { DreamData, AnalysisResponse, AIProviderConfig, AIModel } from '../../types';

class AIService {
  private static instance: AIService;
  private currentProvider: BaseProvider | null = null;
  private currentConfig: AIProviderConfig | null = null;
  private configCacheTime: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  private constructor() {
    console.log('[AIService] Initialized singleton instance');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Load active AI provider from database
   * Results are cached for CACHE_DURATION to minimize DB queries
   */
  private async loadActiveProvider(): Promise<BaseProvider> {
    const now = Date.now();

    // Check cache
    if (this.currentProvider && this.currentConfig && (now - this.configCacheTime) < this.CACHE_DURATION) {
      console.log(`[AIService] Using cached provider: ${this.currentConfig.provider_name}`);
      return this.currentProvider;
    }

    console.log('[AIService] Loading active provider from database');

    // Fetch active provider configuration
    const { data: activeConfig, error: configError } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !activeConfig) {
      console.error('[AIService] Failed to load active provider config:', configError);
      throw new Error('Не удалось загрузить конфигурацию активного AI провайдера. Проверьте настройки в админ-панели.');
    }

    console.log(`[AIService] Active provider: ${activeConfig.provider_name} (${activeConfig.provider_type})`);

    // Fetch active model
    if (!activeConfig.default_model_id) {
      throw new Error(`Провайдер ${activeConfig.provider_name} не имеет модели по умолчанию. Настройте модель в админ-панели.`);
    }

    const { data: activeModel, error: modelError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', activeConfig.default_model_id)
      .single();

    if (modelError || !activeModel) {
      console.error('[AIService] Failed to load active model:', modelError);
      throw new Error('Не удалось загрузить конфигурацию модели AI. Проверьте настройки в админ-панели.');
    }

    console.log(`[AIService] Active model: ${activeModel.model_name} (${activeModel.model_id})`);

    // Create provider instance
    try {
      const provider = AIProviderFactory.create(activeConfig, activeModel);

      // Cache provider and config
      this.currentProvider = provider;
      this.currentConfig = activeConfig;
      this.configCacheTime = now;

      console.log(`[AIService] Provider initialized successfully: ${activeConfig.provider_name}`);
      return provider;
    } catch (error: any) {
      console.error('[AIService] Failed to create provider instance:', error);
      throw new Error(`Ошибка инициализации AI провайдера: ${error.message}`);
    }
  }

  /**
   * Analyze dream using active AI provider
   *
   * @param dreamData - Dream description and context
   * @returns Structured analysis response
   */
  async analyzeDream(dreamData: DreamData): Promise<AnalysisResponse> {
    console.log('[AIService] Starting dream analysis');

    try {
      const provider = await this.loadActiveProvider();
      const result = await provider.analyzeDream(dreamData);

      console.log('[AIService] Dream analysis completed successfully');
      return result;
    } catch (error: any) {
      console.error('[AIService] Dream analysis failed:', error);
      throw error; // Re-throw to be caught by UI
    }
  }

  /**
   * Generate dream visualization image
   *
   * @param prompt - Image generation prompt
   * @returns Base64 data URL of generated image
   */
  async generateImage(prompt: string): Promise<string> {
    console.log('[AIService] Starting image generation');

    try {
      const provider = await this.loadActiveProvider();
      const result = await provider.generateImage(prompt);

      console.log('[AIService] Image generation completed successfully');
      return result;
    } catch (error: any) {
      console.error('[AIService] Image generation failed:', error);
      throw error; // Re-throw to be caught by UI
    }
  }

  /**
   * Get current active provider configuration
   * Useful for displaying active provider info in UI
   */
  async getActiveProviderInfo(): Promise<{ config: AIProviderConfig; model: AIModel } | null> {
    try {
      await this.loadActiveProvider(); // Ensures provider is loaded and cached
      if (!this.currentConfig) return null;

      // Fetch model info
      const { data: model } = await supabase
        .from('ai_models')
        .select('*')
        .eq('id', this.currentConfig.default_model_id)
        .single();

      if (!model) return null;

      return {
        config: this.currentConfig,
        model: model
      };
    } catch (error) {
      console.error('[AIService] Failed to get active provider info:', error);
      return null;
    }
  }

  /**
   * Clear provider cache
   * Forces reload of provider configuration on next request
   */
  clearCache() {
    console.log('[AIService] Clearing provider cache');
    this.currentProvider = null;
    this.currentConfig = null;
    this.configCacheTime = 0;
  }

  /**
   * Test connection to active provider
   * Useful for validating API keys and configuration
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('[AIService] Testing provider connection');

      const provider = await this.loadActiveProvider();

      // Send a minimal test prompt
      const testDreamData: DreamData = {
        description: 'Тестовый сон',
        context: {
          emotion: 'Спокойствие',
          lifeSituation: 'Тест',
          associations: 'Тест',
          recurring: false,
          dayResidue: 'Тест',
          characterType: 'Тест',
          dreamRole: 'Тест',
          physicalSensation: 'Тест'
        },
        method: 'auto' as any
      };

      await provider.analyzeDream(testDreamData);

      console.log('[AIService] Connection test successful');
      return {
        success: true,
        message: 'Подключение к AI провайдеру работает корректно'
      };
    } catch (error: any) {
      console.error('[AIService] Connection test failed:', error);
      return {
        success: false,
        message: error.message || 'Не удалось подключиться к AI провайдеру'
      };
    }
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();

// Export convenience functions for backward compatibility
// These can be used as drop-in replacements for old geminiService functions
export const analyzeDream = (dreamData: DreamData): Promise<AnalysisResponse> => {
  return aiService.analyzeDream(dreamData);
};

export const generateImage = (prompt: string): Promise<string> => {
  return aiService.generateImage(prompt);
};
