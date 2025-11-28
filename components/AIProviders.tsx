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
  Loader
} from 'lucide-react';
import {
  getAllProviders,
  getModelsForProvider,
  updateProviderConfig,
  setActiveProvider,
  testProviderConnection
} from '../services/adminService';
import type { AIProviderConfig, AIModel, AIProviderType } from '../types';

interface AIProvidersProps {
  onBack: () => void;
}

const AIProviders: React.FC<AIProvidersProps> = ({ onBack }) => {
  // State
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [activeProvider, setActiveProviderState] = useState<AIProviderConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderConfig | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Load providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const data = await getAllProviders();
      setProviders(data);
      const active = data.find(p => p.is_active);
      setActiveProviderState(active || null);
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open configuration modal
  const handleConfigureProvider = async (provider: AIProviderConfig) => {
    setSelectedProvider(provider);
    setTestResult(null);

    // Load available models for this provider
    try {
      const models = await getModelsForProvider(provider.provider_type);
      setAvailableModels(models);
      setSelectedModel(provider.default_model_id || '');
    } catch (err) {
      console.error('Failed to load models:', err);
      setAvailableModels([]);
    }

    setShowConfigModal(true);
  };

  // Save configuration and activate provider
  const handleSaveAndActivate = async () => {
    if (!selectedProvider || !selectedModel) {
      alert('Пожалуйста, выберите модель');
      return;
    }

    try {
      // Update provider configuration with selected model
      await updateProviderConfig(selectedProvider.id, {
        default_model_id: selectedModel
      });

      // Activate provider
      await setActiveProvider(selectedProvider.id);

      // Reload providers
      await loadProviders();

      setShowConfigModal(false);
      alert(`Провайдер ${selectedProvider.provider_name} активирован успешно!`);
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
  const ProviderCard = ({ provider }: { provider: AIProviderConfig }) => {
    const getProviderIcon = (type: AIProviderType) => {
      const iconClass = provider.is_active ? 'text-emerald-400' : 'text-slate-400';
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
      <div className={`bg-slate-800/50 backdrop-blur-sm border ${provider.is_active ? 'border-emerald-500/50' : 'border-slate-700/50'} rounded-xl p-6 transition-all hover:border-emerald-500/30`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${provider.is_active ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-slate-700'} rounded-xl flex items-center justify-center shadow-lg`}>
              {getProviderIcon(provider.provider_type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{provider.provider_name}</h3>
              <p className="text-sm text-slate-400 capitalize">{provider.provider_type}</p>
            </div>
          </div>
          <ProviderStatusBadge provider={provider} />
        </div>

        {provider.base_url && (
          <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Base URL</p>
            <p className="text-sm text-slate-300 font-mono truncate">{provider.base_url}</p>
          </div>
        )}

        <button
          onClick={() => handleConfigureProvider(provider)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          <Settings size={16} />
          Настроить {provider.is_active ? '' : '/ Активировать'}
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
        <>
          {/* Active provider info */}
          {activeProvider && (
            <div className="mb-6 p-4 bg-emerald-600/10 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle size={20} />
                <span className="font-semibold">Активный провайдер: {activeProvider.provider_name}</span>
              </div>
            </div>
          )}

          {/* Provider grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map(provider => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </>
      )}

      {/* Configuration Modal */}
      {showConfigModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-2">
                Настройка {selectedProvider.provider_name}
              </h2>
              <p className="text-slate-400 text-sm">
                Выберите модель AI и настройте параметры
              </p>
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

              {/* Test Connection */}
              <div className="mb-6">
                <button
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
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
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
