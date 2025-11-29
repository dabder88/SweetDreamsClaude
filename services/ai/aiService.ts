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
import type { DreamData, AnalysisResponse, AIProviderConfig, AIModel, AITaskType } from '../../types';

class AIService {
  private static instance: AIService;

  // Separate caching for text and image providers
  private textProvider: BaseProvider | null = null;
  private textConfig: AIProviderConfig | null = null;
  private textCacheTime: number = 0;

  private imageProvider: BaseProvider | null = null;
  private imageConfig: AIProviderConfig | null = null;
  private imageCacheTime: number = 0;

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
   * Load active AI provider from database for specific task type
   * Results are cached for CACHE_DURATION to minimize DB queries
   *
   * @param taskType - 'text' for dream analysis, 'image' for visualization
   */
  private async loadActiveProvider(taskType: AITaskType): Promise<BaseProvider> {
    const now = Date.now();

    // Task-specific cache variables
    const cachedProvider = taskType === 'text' ? this.textProvider : this.imageProvider;
    const cachedConfig = taskType === 'text' ? this.textConfig : this.imageConfig;
    const cacheTime = taskType === 'text' ? this.textCacheTime : this.imageCacheTime;

    // Check cache
    if (cachedProvider && cachedConfig && (now - cacheTime) < this.CACHE_DURATION) {
      console.log(`[AIService] Using cached ${taskType} provider: ${cachedConfig.provider_name}`);
      return cachedProvider;
    }

    console.log(`[AIService] Loading active ${taskType} provider from database`);

    // Task-specific field names
    const activeField = taskType === 'text' ? 'is_active_for_text' : 'is_active_for_images';
    const modelField = taskType === 'text' ? 'default_model_id_for_text' : 'default_model_id_for_images';

    // Fetch active provider configuration for this task type
    const { data: activeConfig, error: configError } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .eq(activeField, true)
      .single();

    if (configError || !activeConfig) {
      console.error(`[AIService] Failed to load active ${taskType} provider config:`, configError);
      const taskLabel = taskType === 'text' ? 'текстов' : 'изображений';
      throw new Error(`Не удалось загрузить конфигурацию активного AI провайдера для ${taskLabel}. Проверьте настройки в админ-панели.`);
    }

    console.log(`[AIService] Active ${taskType} provider: ${activeConfig.provider_name} (${activeConfig.provider_type})`);

    // Fetch active model for this task type
    const defaultModelId = activeConfig[modelField];
    if (!defaultModelId) {
      const taskLabel = taskType === 'text' ? 'текстов' : 'изображений';
      throw new Error(`Провайдер ${activeConfig.provider_name} не имеет модели по умолчанию для ${taskLabel}. Настройте модель в админ-панели.`);
    }

    const { data: activeModel, error: modelError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', defaultModelId)
      .single();

    if (modelError || !activeModel) {
      console.error(`[AIService] Failed to load active ${taskType} model:`, modelError);
      throw new Error('Не удалось загрузить конфигурацию модели AI. Проверьте настройки в админ-панели.');
    }

    console.log(`[AIService] Active ${taskType} model: ${activeModel.model_name} (${activeModel.model_id})`);

    // Create provider instance
    try {
      const provider = AIProviderFactory.create(activeConfig, activeModel);

      // Cache provider and config for this task type
      if (taskType === 'text') {
        this.textProvider = provider;
        this.textConfig = activeConfig;
        this.textCacheTime = now;
      } else {
        this.imageProvider = provider;
        this.imageConfig = activeConfig;
        this.imageCacheTime = now;
      }

      console.log(`[AIService] ${taskType} provider initialized successfully: ${activeConfig.provider_name}`);
      return provider;
    } catch (error: any) {
      console.error(`[AIService] Failed to create ${taskType} provider instance:`, error);
      throw new Error(`Ошибка инициализации AI провайдера: ${error.message}`);
    }
  }

  /**
   * Analyze dream using active AI provider for text tasks
   *
   * @param dreamData - Dream description and context
   * @returns Structured analysis response
   */
  async analyzeDream(dreamData: DreamData): Promise<AnalysisResponse> {
    console.log('[AIService] Starting dream analysis (text task)');

    try {
      const provider = await this.loadActiveProvider('text');
      const result = await provider.analyzeDream(dreamData);

      console.log('[AIService] Dream analysis completed successfully');
      return result;
    } catch (error: any) {
      console.error('[AIService] Dream analysis failed:', error);
      throw error; // Re-throw to be caught by UI
    }
  }

  /**
   * Generate dream visualization image using active AI provider for image tasks
   *
   * @param prompt - Image generation prompt
   * @returns Base64 data URL of generated image
   */
  async generateImage(prompt: string): Promise<string> {
    console.log('[AIService] Starting image generation (image task)');

    try {
      const provider = await this.loadActiveProvider('image');
      const result = await provider.generateImage(prompt);

      console.log('[AIService] Image generation completed successfully');
      return result;
    } catch (error: any) {
      console.error('[AIService] Image generation failed:', error);
      throw error; // Re-throw to be caught by UI
    }
  }

  /**
   * Get current active provider configuration for specific task type
   * Useful for displaying active provider info in UI
   *
   * @param taskType - 'text' or 'image'
   */
  async getActiveProviderInfo(taskType: AITaskType = 'text'): Promise<{ config: AIProviderConfig; model: AIModel } | null> {
    try {
      await this.loadActiveProvider(taskType); // Ensures provider is loaded and cached

      const currentConfig = taskType === 'text' ? this.textConfig : this.imageConfig;
      if (!currentConfig) return null;

      // Get model ID for this task type
      const modelField = taskType === 'text' ? 'default_model_id_for_text' : 'default_model_id_for_images';
      const modelId = currentConfig[modelField];

      if (!modelId) return null;

      // Fetch model info
      const { data: model } = await supabase
        .from('ai_models')
        .select('*')
        .eq('id', modelId)
        .single();

      if (!model) return null;

      return {
        config: currentConfig,
        model: model
      };
    } catch (error) {
      console.error(`[AIService] Failed to get active ${taskType} provider info:`, error);
      return null;
    }
  }

  /**
   * Clear provider cache
   * Forces reload of provider configuration on next request
   *
   * @param taskType - Optional: clear cache for specific task type only, or both if not specified
   */
  clearCache(taskType?: AITaskType) {
    if (!taskType || taskType === 'text') {
      console.log('[AIService] Clearing text provider cache');
      this.textProvider = null;
      this.textConfig = null;
      this.textCacheTime = 0;
    }

    if (!taskType || taskType === 'image') {
      console.log('[AIService] Clearing image provider cache');
      this.imageProvider = null;
      this.imageConfig = null;
      this.imageCacheTime = 0;
    }
  }

  /**
   * Test connection to active provider
   * Useful for validating API keys and configuration
   *
   * @param taskType - 'text' or 'image' to test specific provider
   */
  async testConnection(taskType: AITaskType = 'text'): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[AIService] Testing ${taskType} provider connection`);

      const provider = await this.loadActiveProvider(taskType);

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

      console.log(`[AIService] ${taskType} connection test successful`);
      const taskLabel = taskType === 'text' ? 'текстов' : 'изображений';
      return {
        success: true,
        message: `Подключение к AI провайдеру для ${taskLabel} работает корректно`
      };
    } catch (error: any) {
      console.error(`[AIService] ${taskType} connection test failed:`, error);
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
