/**
 * AIProviderFactory - Factory for creating AI provider instances
 *
 * Uses Factory Pattern to instantiate the correct provider based on configuration
 *
 * Key insight: OpenAI, AiTunnel, and NeuroAPI all use OpenAI-compatible API,
 * so they share the same provider class (OpenAIProvider) with different baseURL
 */

import { BaseProvider } from './providers/BaseProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { ClaudeProvider } from './providers/ClaudeProvider';
import type { AIProviderConfig, AIModel } from '../../types';

export class AIProviderFactory {
  /**
   * Create provider instance based on configuration
   *
   * @param config - AI provider configuration
   * @param model - AI model configuration
   * @returns Initialized provider instance
   * @throws Error if provider type is unknown
   */
  static create(config: AIProviderConfig, model: AIModel): BaseProvider {
    switch (config.provider_type) {
      case 'gemini':
        return new GeminiProvider(config, model);

      case 'openai':
      case 'aitunnel':
      case 'neuroapi':
        // All three use OpenAI-compatible API!
        // The only difference is the baseURL:
        // - OpenAI: https://api.openai.com/v1
        // - AiTunnel: https://api.aitunnel.ru/v1
        // - NeuroAPI: https://neuroapi.host/v1
        return new OpenAIProvider(config, model);

      case 'claude':
        return new ClaudeProvider(config, model);

      case 'custom':
        // For custom providers, default to OpenAI-compatible API
        // (most custom providers implement OpenAI-compatible interface)
        return new OpenAIProvider(config, model);

      default:
        throw new Error(`Unknown AI provider type: ${config.provider_type}. Supported types: gemini, openai, aitunnel, neuroapi, claude, custom`);
    }
  }

  /**
   * Check if provider type is supported
   */
  static isSupported(providerType: string): boolean {
    return ['gemini', 'openai', 'aitunnel', 'neuroapi', 'claude', 'custom'].includes(providerType);
  }

  /**
   * Get list of supported provider types
   */
  static getSupportedProviders(): string[] {
    return ['gemini', 'openai', 'aitunnel', 'neuroapi', 'claude', 'custom'];
  }
}
