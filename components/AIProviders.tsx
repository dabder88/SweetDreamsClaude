import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronUp,
  RefreshCw,
  ArrowUpDown,
  Filter,
  XCircle as FilterX
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
  const [refreshing, setRefreshing] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTextProviders, setShowTextProviders] = useState(false);
  const [showImageProviders, setShowImageProviders] = useState(false);
  const [selectedModelForConfig, setSelectedModelForConfig] = useState<string | null>(null);

  // Sorting state
  type SortOption = 'none' | 'price_input_asc' | 'price_input_desc' | 'price_output_asc' | 'price_output_desc' | 'intelligence' | 'speed' | 'context' | 'alphabetical';
  const [sortBy, setSortBy] = useState<SortOption>('none');

  // Filtering state
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriceInputMin, setFilterPriceInputMin] = useState<string>('');
  const [filterPriceInputMax, setFilterPriceInputMax] = useState<string>('');
  const [filterPriceOutputMin, setFilterPriceOutputMin] = useState<string>('');
  const [filterPriceOutputMax, setFilterPriceOutputMax] = useState<string>('');
  const [filterCurrency, setFilterCurrency] = useState<'ALL' | 'RUB' | 'USD'>('ALL');
  const [filterIntelligence, setFilterIntelligence] = useState<string[]>([]);
  const [filterReasoning, setFilterReasoning] = useState<'all' | 'yes' | 'no'>('all');
  const [filterSpeed, setFilterSpeed] = useState<string[]>([]);
  const [filterContextMin, setFilterContextMin] = useState<string>('');
  const [filterContextMax, setFilterContextMax] = useState<string>('');
  const [filterProviders, setFilterProviders] = useState<string[]>([]);

  // Configuration state
  const [providerTemperature, setProviderTemperature] = useState<number>(0.4);
  const [providerMaxTokens, setProviderMaxTokens] = useState<number>(8192);
  const [modelConfigs, setModelConfigs] = useState<Record<string, { temperature: number; max_tokens: number }>>({});

  // Load providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

  // Filtered and sorted models with useMemo for performance
  const sortedModels = useMemo(() => {
    // Step 1: Apply filters
    let filtered = [...availableModels];

    // Filter by price input
    if (filterPriceInputMin !== '' || filterPriceInputMax !== '') {
      filtered = filtered.filter(model => {
        if (filterCurrency !== 'ALL' && model.pricing.currency !== filterCurrency) return false;

        const min = filterPriceInputMin !== '' ? parseFloat(filterPriceInputMin) : -Infinity;
        const max = filterPriceInputMax !== '' ? parseFloat(filterPriceInputMax) : Infinity;
        return model.pricing.input >= min && model.pricing.input <= max;
      });
    }

    // Filter by price output
    if (filterPriceOutputMin !== '' || filterPriceOutputMax !== '') {
      filtered = filtered.filter(model => {
        if (filterCurrency !== 'ALL' && model.pricing.currency !== filterCurrency) return false;

        const min = filterPriceOutputMin !== '' ? parseFloat(filterPriceOutputMin) : -Infinity;
        const max = filterPriceOutputMax !== '' ? parseFloat(filterPriceOutputMax) : Infinity;
        return model.pricing.output >= min && model.pricing.output <= max;
      });
    }

    // Filter by currency (if only currency is selected without price ranges)
    if (filterCurrency !== 'ALL' && filterPriceInputMin === '' && filterPriceInputMax === '' && filterPriceOutputMin === '' && filterPriceOutputMax === '') {
      filtered = filtered.filter(model => model.pricing.currency === filterCurrency);
    }

    // Filter by intelligence
    if (filterIntelligence.length > 0) {
      filtered = filtered.filter(model => filterIntelligence.includes(model.performance.intelligence));
    }

    // Filter by reasoning capability
    if (filterReasoning !== 'all') {
      const hasReasoning = filterReasoning === 'yes';
      filtered = filtered.filter(model => model.capabilities.reasoning === hasReasoning);
    }

    // Filter by speed
    if (filterSpeed.length > 0) {
      filtered = filtered.filter(model => filterSpeed.includes(model.performance.speed));
    }

    // Filter by context length
    if (filterContextMin !== '' || filterContextMax !== '') {
      filtered = filtered.filter(model => {
        const min = filterContextMin !== '' ? parseInt(filterContextMin) : -Infinity;
        const max = filterContextMax !== '' ? parseInt(filterContextMax) : Infinity;
        return model.context_length >= min && model.context_length <= max;
      });
    }

    // Filter by provider name
    if (filterProviders.length > 0) {
      filtered = filtered.filter(model => filterProviders.includes(model.provider_name || ''));
    }

    // Step 2: Apply sorting
    if (sortBy === 'none') return filtered;

    const sorted = [...filtered];

    switch (sortBy) {
      case 'price_input_asc':
        return sorted.sort((a, b) => a.pricing.input - b.pricing.input);
      case 'price_input_desc':
        return sorted.sort((a, b) => b.pricing.input - a.pricing.input);
      case 'price_output_asc':
        return sorted.sort((a, b) => a.pricing.output - b.pricing.output);
      case 'price_output_desc':
        return sorted.sort((a, b) => b.pricing.output - a.pricing.output);
      case 'intelligence': {
        const intelligenceOrder = { highest: 0, high: 1, medium: 2, low: 3 };
        return sorted.sort((a, b) => {
          const aLevel = intelligenceOrder[a.performance.intelligence as keyof typeof intelligenceOrder] ?? 999;
          const bLevel = intelligenceOrder[b.performance.intelligence as keyof typeof intelligenceOrder] ?? 999;
          return aLevel - bLevel;
        });
      }
      case 'speed': {
        const speedOrder = { fastest: 0, fast: 1, medium: 2, slow: 3 };
        return sorted.sort((a, b) => {
          const aLevel = speedOrder[a.performance.speed as keyof typeof speedOrder] ?? 999;
          const bLevel = speedOrder[b.performance.speed as keyof typeof speedOrder] ?? 999;
          return aLevel - bLevel;
        });
      }
      case 'context':
        return sorted.sort((a, b) => b.context_length - a.context_length);
      case 'alphabetical':
        return sorted.sort((a, b) => a.model_name.localeCompare(b.model_name, 'ru'));
      default:
        return sorted;
    }
  }, [
    availableModels,
    sortBy,
    filterPriceInputMin,
    filterPriceInputMax,
    filterPriceOutputMin,
    filterPriceOutputMax,
    filterCurrency,
    filterIntelligence,
    filterReasoning,
    filterSpeed,
    filterContextMin,
    filterContextMax,
    filterProviders
  ]);

  // Get unique provider names from available models
  const uniqueProviderNames = useMemo(() => {
    const names = new Set<string>();
    availableModels.forEach(model => {
      if (model.provider_name) names.add(model.provider_name);
    });
    return Array.from(names).sort();
  }, [availableModels]);

  // Reset all filters
  const resetFilters = () => {
    setFilterPriceInputMin('');
    setFilterPriceInputMax('');
    setFilterPriceOutputMin('');
    setFilterPriceOutputMax('');
    setFilterCurrency('ALL');
    setFilterIntelligence([]);
    setFilterReasoning('all');
    setFilterSpeed([]);
    setFilterContextMin('');
    setFilterContextMax('');
    setFilterProviders([]);
  };

  // Toggle checkbox array (for multi-select filters)
  const toggleArrayFilter = (arr: string[], value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (arr.includes(value)) {
      setter(arr.filter(v => v !== value));
    } else {
      setter([...arr, value]);
    }
  };

  const loadProviders = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
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
      setRefreshing(false);
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

    // Open modal immediately with loading state
    setShowConfigModal(true);
    setLoadingModels(true);
    setAvailableModels([]); // Clear previous models

    // Load available models for this provider filtered by task type
    try {
      const models = await getModelsForTask(provider.provider_type, taskType);
      setAvailableModels(models);

      // Set default model based on task type
      const defaultModelId = taskType === 'text'
        ? provider.default_model_id_for_text
        : provider.default_model_id_for_images;
      setSelectedModel(defaultModelId || models[0]?.id || '');

      // Initialize model configurations (optimized - only create configs, don't iterate unnecessarily)
      const configs: Record<string, { temperature: number; max_tokens: number }> = {};
      const defaultTemp = provider.config.temperature || 0.4;
      const defaultMaxTokens = provider.config.max_tokens || 8192;

      models.forEach(model => {
        configs[model.id] = {
          temperature: model.model_config?.temperature || defaultTemp,
          max_tokens: model.model_config?.max_tokens || defaultMaxTokens
        };
      });
      setModelConfigs(configs);
    } catch (err) {
      console.error('Failed to load models:', err);
      setAvailableModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  // Save configuration and activate provider
  const handleSaveAndActivate = async () => {
    if (!selectedProvider || !selectedModel || !selectedTaskType) {
      alert('Пожалуйста, выберите модель');
      return;
    }

    // Set saving state and close modal immediately
    setSaving(true);
    setShowConfigModal(false);

    try {
      // Determine which field to update based on task type
      const defaultModelField = selectedTaskType === 'text'
        ? 'default_model_id_for_text'
        : 'default_model_id_for_images';

      // Get the currently selected model's config
      const selectedModelConfig = modelConfigs[selectedModel];

      // Run all operations in parallel for better performance
      await Promise.all([
        // Update provider configuration (default params + selected model for task)
        updateProviderConfig(selectedProvider.id, {
          [defaultModelField]: selectedModel,
          config: {
            temperature: providerTemperature,
            max_tokens: providerMaxTokens,
            top_p: 1.0
          }
        }),

        // Update ONLY the selected model's configuration (not all models!)
        selectedModelConfig ? updateModel(selectedModel, {
          model_config: {
            temperature: selectedModelConfig.temperature,
            max_tokens: selectedModelConfig.max_tokens,
            top_p: 1.0
          }
        }) : Promise.resolve(),

        // Activate provider for this specific task type
        setActiveProviderForTask(selectedProvider.id, selectedTaskType)
      ]);

      // Reload providers after all updates
      await loadProviders();

      const taskLabel = selectedTaskType === 'text' ? 'текстов' : 'изображений';
      alert(`Провайдер ${selectedProvider.provider_name} активирован для ${taskLabel}!`);
    } catch (err: any) {
      console.error('Failed to save configuration:', err);
      alert(`Ошибка: ${err.message || 'Не удалось сохранить настройки'}`);
    } finally {
      setSaving(false);
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
  // Memoized ModelCard component for better performance with large lists
  const ModelCard = React.memo(({ model, isSelected, onSelect }: { model: AIModel; isSelected: boolean; onSelect: () => void }) => {
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
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
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
          <div className="flex-1">
            <h1 className="text-3xl font-serif font-bold text-white">AI Провайдеры</h1>
            <p className="text-slate-400 text-sm">
              {saving ? (
                <span className="flex items-center gap-2 text-emerald-400">
                  <Loader className="w-4 h-4 animate-spin" />
                  Сохранение настроек...
                </span>
              ) : (
                'Управление AI провайдерами и моделями'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadProviders(true)}
            disabled={refreshing || saving}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Обновление...' : 'Обновить данные'}
          </button>
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Выберите модель</h3>

                  {/* Filter and Sort Controls */}
                  {!loadingModels && availableModels.length > 0 && (
                    <div className="flex items-center gap-2">
                      {/* Filter Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          showFilters
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <Filter size={16} />
                        Фильтры
                      </button>

                      {/* Sort Controls */}
                      <ArrowUpDown size={16} className="text-slate-400" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        aria-label="Сортировка моделей"
                        className="px-3 py-1.5 bg-slate-700 text-white border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="none">Без сортировки</option>
                        <option value="price_input_asc">Цена Input ↑</option>
                        <option value="price_input_desc">Цена Input ↓</option>
                        <option value="price_output_asc">Цена Output ↑</option>
                        <option value="price_output_desc">Цена Output ↓</option>
                        <option value="intelligence">Уровень мышления</option>
                        <option value="speed">Скорость</option>
                        <option value="context">Контекстное окно</option>
                        <option value="alphabetical">Алфавитный порядок</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Filters Panel */}
                {showFilters && !loadingModels && availableModels.length > 0 && (
                  <div className="mb-4 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white">Фильтры</h4>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        <FilterX size={14} />
                        Сбросить всё
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Price Input Filter */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Цена Input</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="От"
                            value={filterPriceInputMin}
                            onChange={(e) => setFilterPriceInputMin(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-800 text-white border border-slate-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-slate-500">—</span>
                          <input
                            type="number"
                            placeholder="До"
                            value={filterPriceInputMax}
                            onChange={(e) => setFilterPriceInputMax(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-800 text-white border border-slate-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Price Output Filter */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Цена Output</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="От"
                            value={filterPriceOutputMin}
                            onChange={(e) => setFilterPriceOutputMin(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-800 text-white border border-slate-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-slate-500">—</span>
                          <input
                            type="number"
                            placeholder="До"
                            value={filterPriceOutputMax}
                            onChange={(e) => setFilterPriceOutputMax(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-800 text-white border border-slate-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Currency Filter */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Валюта</label>
                        <select
                          value={filterCurrency}
                          onChange={(e) => setFilterCurrency(e.target.value as 'ALL' | 'RUB' | 'USD')}
                          aria-label="Фильтр по валюте"
                          className="w-full px-2 py-1 bg-slate-800 text-white border border-slate-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="ALL">Все валюты</option>
                          <option value="RUB">Рубли (RUB)</option>
                          <option value="USD">Доллары (USD)</option>
                        </select>
                      </div>

                      {/* Context Length Filter */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Контекст (токены)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="От"
                            value={filterContextMin}
                            onChange={(e) => setFilterContextMin(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-800 text-white border border-slate-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-slate-500">—</span>
                          <input
                            type="number"
                            placeholder="До"
                            value={filterContextMax}
                            onChange={(e) => setFilterContextMax(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-800 text-white border border-slate-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Intelligence Filter */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Уровень мышления</label>
                        <div className="flex flex-wrap gap-2">
                          {['highest', 'high', 'medium', 'low'].map(level => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => toggleArrayFilter(filterIntelligence, level, setFilterIntelligence)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                filterIntelligence.includes(level)
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                            >
                              {level === 'highest' ? 'Наивысший' : level === 'high' ? 'Высокий' : level === 'medium' ? 'Средний' : 'Низкий'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Speed Filter */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Скорость</label>
                        <div className="flex flex-wrap gap-2">
                          {['fastest', 'fast', 'medium', 'slow'].map(speed => (
                            <button
                              key={speed}
                              type="button"
                              onClick={() => toggleArrayFilter(filterSpeed, speed, setFilterSpeed)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                filterSpeed.includes(speed)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                            >
                              {speed === 'fastest' ? 'Самая быстрая' : speed === 'fast' ? 'Быстрая' : speed === 'medium' ? 'Средняя' : 'Медленная'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reasoning Filter */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Режим рассуждений</label>
                        <select
                          value={filterReasoning}
                          onChange={(e) => setFilterReasoning(e.target.value as 'all' | 'yes' | 'no')}
                          aria-label="Фильтр по режиму рассуждений"
                          className="w-full px-2 py-1 bg-slate-800 text-white border border-slate-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="all">Все модели</option>
                          <option value="yes">Думающие</option>
                          <option value="no">Обычные</option>
                        </select>
                      </div>

                      {/* Provider Filter */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Оператор</label>
                        <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                          {uniqueProviderNames.map(providerName => (
                            <button
                              key={providerName}
                              type="button"
                              onClick={() => toggleArrayFilter(filterProviders, providerName, setFilterProviders)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                filterProviders.includes(providerName)
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                            >
                              {providerName}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Active Filters Count */}
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-xs text-slate-400">
                        Найдено моделей: <span className="text-emerald-400 font-semibold">{sortedModels.length}</span> из {availableModels.length}
                      </p>
                    </div>
                  </div>
                )}

                {loadingModels ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                    <p className="text-slate-400 text-sm">Загрузка моделей...</p>
                  </div>
                ) : availableModels.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Нет доступных моделей для этого провайдера</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                    {sortedModels.map(model => {
                      const handleSelectModel = () => setSelectedModel(model.id);
                      return (
                        <ModelCard
                          key={model.id}
                          model={model}
                          isSelected={selectedModel === model.id}
                          onSelect={handleSelectModel}
                        />
                      );
                    })}
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
                disabled={!selectedModel || saving || loadingModels}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить и активировать'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIProviders;
