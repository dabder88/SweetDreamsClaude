import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Cpu,
  Check,
  Settings,
  Zap,
  DollarSign,
  Clock,
  Brain,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  getAllProviders,
  getModelsForProvider,
  getModelsForTask,
  updateProviderConfig,
  setActiveProvider,
  setActiveProviderForTask,
  testProviderConnection,
  updateModel
} from '../services/adminService';
import type { AIProviderConfig, AIModel, AIProviderType, AITaskType } from '../types';

interface AIProvidersProps {
  onBack: () => void;
}

const AIProviders: React.FC<AIProvidersProps> = ({ onBack }) => {
  // State
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [activeProviderForText, setActiveProviderForText] = useState<AIProviderConfig | null>(null);
  const [activeProviderForImages, setActiveProviderForImages] = useState<AIProviderConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderConfig | null>(null);
  const [selectedTaskType, setSelectedTaskType] = useState<AITaskType>('text'); // 'text' or 'image'
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTextProviders, setShowTextProviders] = useState(false);
  const [showImageProviders, setShowImageProviders] = useState(false);
  const [selectedModelForConfig, setSelectedModelForConfig] = useState<string | null>(null);

  // Configuration state
  const [providerTemperature, setProviderTemperature] = useState<number>(0.4);
  const [providerMaxTokens, setProviderMaxTokens] = useState<number>(8192);
  const [modelConfigs, setModelConfigs] = useState<Record<string, { temperature: number; max_tokens: number }>>({});

  // Load providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const data = await getAllProviders();
      setProviders(data);

      // Find active providers for each task type
      const activeText = data.find(p => p.is_active_for_text);
      const activeImages = data.find(p => p.is_active_for_images);

      setActiveProviderForText(activeText || null);
      setActiveProviderForImages(activeImages || null);
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open configuration modal
  const handleConfigureProvider = async (provider: AIProviderConfig, taskType: AITaskType) => {
    setSelectedProvider(provider);
    setSelectedTaskType(taskType);
    setTestResult(null);

    // Initialize provider configuration
    setProviderTemperature(provider.config.temperature || 0.4);
    setProviderMaxTokens(provider.config.max_tokens || 8192);

    // Load available models for this provider filtered by task type
    try {
      const models = await getModelsForTask(provider.provider_type, taskType);
      setAvailableModels(models);

      // Set default model based on task type
      const defaultModelId = taskType === 'text'
        ? provider.default_model_id_for_text
        : provider.default_model_id_for_images;
      setSelectedModel(defaultModelId || models[0]?.id || '');

      // Initialize model configurations
      const configs: Record<string, { temperature: number; max_tokens: number }> = {};
      models.forEach(model => {
        configs[model.id] = {
          temperature: model.model_config?.temperature || provider.config.temperature || 0.4,
          max_tokens: model.model_config?.max_tokens || provider.config.max_tokens || 8192
        };
      });
      setModelConfigs(configs);
    } catch (err) {
      console.error('Failed to load models:', err);
      setAvailableModels([]);
    }

    setShowConfigModal(true);
  };

  // Save configuration and activate provider
  const handleSaveAndActivate = async () => {
    if (!selectedProvider || !selectedModel || !selectedTaskType) {
      alert('Пожалуйста, выберите модель');
      return;
    }

    try {
      // Determine which field to update based on task type
      const defaultModelField = selectedTaskType === 'text'
        ? 'default_model_id_for_text'
        : 'default_model_id_for_images';

      // Update provider configuration (default params + selected model for task)
      await updateProviderConfig(selectedProvider.id, {
        [defaultModelField]: selectedModel,
        config: {
          temperature: providerTemperature,
          max_tokens: providerMaxTokens,
          top_p: 1.0
        }
      });

      // Update each model's configuration
      for (const model of availableModels) {
        const modelConfig = modelConfigs[model.id];
        if (modelConfig) {
          await updateModel(model.id, {
            model_config: {
              temperature: modelConfig.temperature,
              max_tokens: modelConfig.max_tokens,
              top_p: 1.0
            }
          });
        }
      }

      // Activate provider for this specific task type
      await setActiveProviderForTask(selectedProvider.id, selectedTaskType);

      // Reload providers
      await loadProviders();

      setShowConfigModal(false);

      const taskLabel = selectedTaskType === 'text' ? 'текстов' : 'изображений';
      alert(`Провайдер ${selectedProvider.provider_name} активирован для ${taskLabel}!`);
    } catch (err: any) {
      console.error('Failed to save configuration:', err);
      alert(`Ошибка: ${err.message || 'Не удалось сохранить настройки'}`);
    }
  };

  // Test provider connection
  const handleTestConnection = async () => {
    if (!selectedProvider) return;

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testProviderConnection(selectedProvider.id);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Не удалось протестировать подключение'
      });
    } finally {
      setTesting(false);
    }
  };

  // Provider status badge
  const ProviderStatusBadge = ({ provider }: { provider: AIProviderConfig }) => {
    if (provider.is_active) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 text-green-400 rounded-md text-xs font-medium">
          <CheckCircle size={12} />
          Активен
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-400 rounded-md text-xs font-medium">
          Неактивен
        </span>
    );
  };

  // Provider card
  const ProviderCard = ({
    provider,
    taskType,
    isActive,
    onConfigure
  }: {
    provider: AIProviderConfig;
    taskType: AITaskType;
    isActive: boolean;
    onConfigure: () => void;
  }) => {
    const getProviderIcon = (type: AIProviderType) => {
      const iconClass = isActive ? 'text-emerald-400' : 'text-slate-400';
      switch (type) {
        case 'gemini':
          return <Brain className={iconClass} size={24} />;
        case 'openai':
        case 'aitunnel':
        case 'neuroapi':
          return <Cpu className={iconClass} size={24} />;
        case 'claude':
          return <Zap className={iconClass} size={24} />;
        default:
          return <Cpu className={iconClass} size={24} />;
      }
    };

    return (
      <div className={`bg-slate-800/50 backdrop-blur-sm border ${isActive ? 'border-emerald-500/50' : 'border-slate-700/50'} rounded-xl p-4 transition-all hover:border-emerald-500/30`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 ${isActive ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-slate-700'} rounded-lg flex items-center justify-center shadow-lg`}>
              {getProviderIcon(provider.provider_type)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{provider.provider_name}</h3>
              <p className="text-xs text-slate-400 capitalize">{provider.provider_type}</p>
            </div>
          </div>
          {isActive && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded text-xs font-medium">
              <CheckCircle size={12} />
              Активен
            </span>
          )}
        </div>

        {provider.base_url && (
          <div className="mb-3 p-2 bg-slate-900/50 rounded">
            <p className="text-xs text-slate-500 mb-0.5">Base URL</p>
            <p className="text-xs text-slate-300 font-mono truncate">{provider.base_url}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onConfigure}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
        >
          <Settings size={14} />
          {isActive ? 'Настроить' : 'Настроить / Активировать'}
        </button>
      </div>
    );
  };

  // Model selection card
  const ModelCard = ({ model, isSelected, onSelect }: { model: AIModel; isSelected: boolean; onSelect: () => void }) => {
    return (
      <button
        onClick={onSelect}
        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
          isSelected
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-slate-700 bg-slate-800/50 hover:border-emerald-500/30'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold text-white">{model.model_name}</h4>
            <p className="text-xs text-slate-400 font-mono">{model.model_id}</p>
          </div>
          {isSelected && <Check className="text-emerald-400" size={20} />}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-1 text-xs">
            <DollarSign size={12} className="text-amber-400" />
            <span className="text-slate-300">
              {model.pricing.input.toFixed(2)} / {model.pricing.output.toFixed(2)} {model.pricing.currency}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Clock size={12} className="text-blue-400" />
            <span className="text-slate-300 capitalize">{model.performance.speed}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Brain size={12} className="text-purple-400" />
            <span className="text-slate-300 capitalize">{model.performance.intelligence}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Cpu size={12} className="text-green-400" />
            <span className="text-slate-300">{(model.context_length / 1000).toFixed(0)}K tokens</span>
          </div>
        </div>

        {(model.capabilities.image || model.capabilities.reasoning) && (
          <div className="flex gap-1 mt-2">
            {model.capabilities.image && (
              <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs">Изображения</span>
            )}
            {model.capabilities.reasoning && (
              <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">Reasoning</span>
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          Назад к обзору
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <Cpu className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-white">AI Провайдеры</h1>
            <p className="text-slate-400 text-sm">Управление AI провайдерами и моделями</p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Загрузка провайдеров...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ===== БЛОК 1: ИИ ДЛЯ ТЕКСТОВ ===== */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTextProviders(!showTextProviders)}
              className="w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Brain className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-semibold text-white">ИИ для текстов</h2>
                  <p className="text-sm text-slate-400">Анализ снов, отчёты</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activeProviderForText && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">{activeProviderForText.provider_name}</span>
                  </div>
                )}
                {showTextProviders ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
              </div>
            </button>

            {showTextProviders && (
              <div className="p-6 pt-0 border-t border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providers.map(provider => (
                    <ProviderCard
                      key={`text-${provider.id}`}
                      provider={provider}
                      taskType="text"
                      isActive={activeProviderForText?.id === provider.id}
                      onConfigure={() => handleConfigureProvider(provider, 'text')}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ===== БЛОК 2: ИИ ДЛЯ ИЗОБРАЖЕНИЙ ===== */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowImageProviders(!showImageProviders)}
              className="w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Zap className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-semibold text-white">ИИ для изображений</h2>
                  <p className="text-sm text-slate-400">Визуализация снов, аватары</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activeProviderForImages && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">{activeProviderForImages.provider_name}</span>
                  </div>
                )}
                {showImageProviders ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
              </div>
            </button>

            {showImageProviders && (
              <div className="p-6 pt-0 border-t border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providers
                    .filter(provider => provider.provider_type !== 'claude') // Exclude Claude from image providers
                    .map(provider => (
                      <ProviderCard
                        key={`image-${provider.id}`}
                        provider={provider}
                        taskType="image"
                        isActive={activeProviderForImages?.id === provider.id}
                        onConfigure={() => handleConfigureProvider(provider, 'image')}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Настройка {selectedProvider.provider_name}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-slate-400 text-sm">
                    {selectedTaskType === 'text' ? 'Для текстов (анализ снов, отчёты)' : 'Для изображений (визуализация, аватары)'}
                  </p>
                  {selectedTaskType === 'text' ? (
                    <Brain size={16} className="text-blue-400" />
                  ) : (
                    <Zap size={16} className="text-purple-400" />
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Закрыть"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Model Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Выберите модель</h3>
                {availableModels.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Нет доступных моделей для этого провайдера</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableModels.map(model => (
                      <ModelCard
                        key={model.id}
                        model={model}
                        isSelected={selectedModel === model.id}
                        onSelect={() => setSelectedModel(model.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Per-Model Configuration */}
              {availableModels.length > 0 && selectedModel && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Настройки модели</h3>
                  {(() => {
                    const model = availableModels.find(m => m.id === selectedModel);
                    if (!model) return null;

                    return (
                      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-white font-medium">{model.model_name}</h4>
                            <p className="text-xs text-slate-400 font-mono">{model.model_id}</p>
                          </div>
                          <span className="px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded text-xs">
                            Выбрана
                          </span>
                        </div>

                        <div className="space-y-3">
                          {/* Model Temperature */}
                          <div>
                            <label className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span>Temperature</span>
                              <span className="font-mono text-emerald-400">{modelConfigs[model.id]?.temperature.toFixed(1) || '0.4'}</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={modelConfigs[model.id]?.temperature || 0.4}
                              onChange={(e) => {
                                setModelConfigs({
                                  ...modelConfigs,
                                  [model.id]: {
                                    ...modelConfigs[model.id],
                                    temperature: parseFloat(e.target.value)
                                  }
                                });
                              }}
                              aria-label={`Temperature for ${model.model_name}`}
                              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>

                          {/* Model Max Tokens */}
                          <div>
                            <label className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span>Max Tokens</span>
                              <span className="font-mono text-emerald-400">{modelConfigs[model.id]?.max_tokens || 8192}</span>
                            </label>
                            <input
                              type="range"
                              min="1000"
                              max="32000"
                              step="1000"
                              value={modelConfigs[model.id]?.max_tokens || 8192}
                              onChange={(e) => {
                                setModelConfigs({
                                  ...modelConfigs,
                                  [model.id]: {
                                    ...modelConfigs[model.id],
                                    max_tokens: parseInt(e.target.value)
                                  }
                                });
                              }}
                              aria-label={`Max tokens for ${model.model_name}`}
                              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Test Connection */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !selectedModel}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                >
                  {testing ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Тестирование...
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Тестировать подключение
                    </>
                  )}
                </button>

                {testResult && (
                  <div className={`mt-3 p-3 rounded-lg border ${testResult.success ? 'bg-green-600/10 border-green-500/30 text-green-400' : 'bg-red-600/10 border-red-500/30 text-red-400'}`}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      <span className="text-sm font-medium">{testResult.message}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* API Key Note */}
              <div className="mb-6 p-4 bg-amber-600/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-amber-400 font-semibold mb-1">Важно: API ключ</p>
                    <p className="text-amber-300/80">
                      Убедитесь, что переменная окружения <code className="px-1 py-0.5 bg-slate-900/50 rounded text-xs">{selectedProvider.api_key_env_name}</code> установлена в файле .env
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveAndActivate}
                disabled={!selectedModel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
              >
                Сохранить и активировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIProviders;
