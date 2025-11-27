import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Calendar,
  CreditCard,
  DollarSign,
  Plus,
  Minus,
  TrendingUp,
  BookOpen,
  Ban,
  CheckCircle,
  Edit,
  Save,
  X,
  BarChart3,
  FileText,
  Clock
} from 'lucide-react';
import {
  getUserTransactions,
  adjustBalance,
  getUserAnalysisMetadata,
  getUserDreamEntries,
  TransactionType,
  type Transaction
} from '../services/adminService';
import type { User, AnalysisMetadata, JournalEntry } from '../types';

interface UserWithBalance extends User {
  balance?: number;
  dreamCount?: number;
}

interface UserDetailProps {
  user: UserWithBalance;
  onBack: () => void;
  onUserUpdate?: () => void;
  onViewDream?: (entry: JournalEntry) => void;
}

const UserDetail: React.FC<UserDetailProps> = ({ user, onBack, onUserUpdate, onViewDream }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceAction, setBalanceAction] = useState<'credit' | 'debit'>('credit');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(user.balance || 0);

  // Dream history states
  const [analysisMetadata, setAnalysisMetadata] = useState<AnalysisMetadata[]>([]);
  const [dreamEntries, setDreamEntries] = useState<JournalEntry[]>([]);
  const [loadingDreams, setLoadingDreams] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'dreams' | 'analytics'>('transactions');

  useEffect(() => {
    loadTransactions();
    loadDreamHistory();
    setCurrentBalance(user.balance || 0);
  }, [user.id, user.balance]);

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const userTransactions = await getUserTransactions(user.id, 10);
      setTransactions(userTransactions);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadDreamHistory = async () => {
    try {
      setLoadingDreams(true);
      const [metadata, entries] = await Promise.all([
        getUserAnalysisMetadata(user.id),
        getUserDreamEntries(user.id)
      ]);
      setAnalysisMetadata(metadata);
      setDreamEntries(entries);
    } catch (err) {
      console.error('Error loading dream history:', err);
    } finally {
      setLoadingDreams(false);
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!balanceAmount || parseFloat(balanceAmount) <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    if (!balanceReason.trim()) {
      alert('Укажите причину изменения баланса');
      return;
    }

    try {
      setProcessing(true);

      const type = balanceAction === 'credit'
        ? TransactionType.ADMIN_CREDIT
        : TransactionType.ADMIN_DEBIT;

      const transaction = await adjustBalance(
        user.id,
        parseFloat(balanceAmount),
        type,
        balanceReason
      );

      if (transaction) {
        // Update local balance immediately
        setCurrentBalance(transaction.balance_after);
      }

      // Reload transactions and notify parent
      await loadTransactions();
      if (onUserUpdate) {
        onUserUpdate();
      }

      // Reset form and close modal
      setBalanceAmount('');
      setBalanceReason('');
      setShowBalanceModal(false);

      alert('Баланс успешно изменен');
    } catch (err) {
      console.error('Error adjusting balance:', err);
      alert('Ошибка при изменении баланса');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      [TransactionType.DREAM_ANALYSIS]: 'Анализ сна',
      [TransactionType.IMAGE_GENERATION]: 'Генерация изображения',
      [TransactionType.ADMIN_CREDIT]: 'Пополнение (админ)',
      [TransactionType.ADMIN_DEBIT]: 'Списание (админ)',
      [TransactionType.PURCHASE]: 'Покупка',
      [TransactionType.REFUND]: 'Возврат'
    };
    return labels[type] || type;
  };

  const getTransactionColor = (type: string) => {
    if (type === TransactionType.ADMIN_CREDIT || type === TransactionType.REFUND) {
      return 'text-green-400';
    }
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="text-white" size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">Информация о пользователе</h2>
          <p className="text-slate-400">Детальный просмотр и управление</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 space-y-6">
            {/* Avatar and Name */}
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || user.email}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (user.name || user.email)[0].toUpperCase()
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{user.name || 'Без имени'}</h3>
              <p className="text-slate-400 text-sm">{user.email}</p>
              {user.role === 'admin' && (
                <span className="inline-block mt-3 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-medium">
                  Администратор
                </span>
              )}
            </div>

            {/* User Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Mail size={18} className="text-slate-400" />
                <div className="flex-1">
                  <div className="text-xs text-slate-400">Email</div>
                  <div className="text-sm">{user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <Calendar size={18} className="text-slate-400" />
                <div className="flex-1">
                  <div className="text-xs text-slate-400">Дата регистрации</div>
                  <div className="text-sm">{formatDate(user.created_at)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <UserIcon size={18} className="text-slate-400" />
                <div className="flex-1">
                  <div className="text-xs text-slate-400">ID пользователя</div>
                  <div className="text-sm font-mono">{user.id}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance and Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center">
                  <CreditCard className="text-white" size={24} />
                </div>
                <div>
                  <div className="text-blue-100 text-sm">Баланс пользователя</div>
                  <div className="text-3xl font-bold text-white">{currentBalance} ₽</div>
                </div>
              </div>
              <button
                onClick={() => setShowBalanceModal(true)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white rounded-xl transition-colors flex items-center gap-2"
              >
                <DollarSign size={18} />
                Изменить
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => {
                  setBalanceAction('credit');
                  setShowBalanceModal(true);
                }}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Пополнить
              </button>
              <button
                onClick={() => {
                  setBalanceAction('debit');
                  setShowBalanceModal(true);
                }}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Minus size={18} />
                Списать
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen size={20} className="text-purple-400" />
                <span className="text-slate-400 text-sm">Всего снов</span>
              </div>
              <div className="text-3xl font-bold text-white">{user.dreamCount || 0}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={20} className="text-green-400" />
                <span className="text-slate-400 text-sm">Транзакций</span>
              </div>
              <div className="text-3xl font-bold text-white">{transactions.length}</div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-slate-700/50">
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'
                }`}
              >
                <TrendingUp size={18} />
                <span className="font-medium">Транзакции</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dreams')}
                className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'dreams'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'
                }`}
              >
                <BookOpen size={18} />
                <span className="font-medium">История снов</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-green-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'
                }`}
              >
                <BarChart3 size={18} />
                <span className="font-medium">Аналитика</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div>

            {loadingTransactions ? (
              <div className="text-center py-8 text-slate-400">Загрузка...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">Транзакции отсутствуют</div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50"
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {getTransactionTypeLabel(transaction.type)}
                      </div>
                      <div className="text-sm text-slate-400">
                        {formatDate(transaction.created_at)}
                      </div>
                      {transaction.description && (
                        <div className="text-xs text-slate-500 mt-1">{transaction.description}</div>
                      )}
                    </div>
                    <div className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === TransactionType.ADMIN_CREDIT || transaction.type === TransactionType.REFUND ? '+' : '-'}
                      {transaction.amount} ₽
                    </div>
                  </div>
                ))}
              </div>
            )}
                </div>
              )}

              {/* Dreams Tab */}
              {activeTab === 'dreams' && (
                <div className="space-y-4">
                  {loadingDreams ? (
                    <div className="text-center py-8 text-slate-400">Загрузка...</div>
                  ) : (
                    <>
                      {/* Saved Dreams (dream_entries) */}
                      {dreamEntries.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <FileText size={18} className="text-green-400" />
                            Сохраненные сны ({dreamEntries.length})
                          </h4>
                          <div className="space-y-2">
                            {dreamEntries.map((entry) => (
                              <button
                                key={entry.id}
                                type="button"
                                onClick={() => onViewDream && onViewDream(entry)}
                                className="w-full text-left p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-green-500/50 hover:bg-slate-800/50 transition-all cursor-pointer"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="text-white font-medium line-clamp-2 mb-2">
                                      {entry.dreamData?.description || 'Описание отсутствует'}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      <span className="flex items-center gap-1 text-slate-400">
                                        <Clock size={12} />
                                        {new Date(entry.timestamp).toLocaleString('ru-RU')}
                                      </span>
                                      {entry.dreamData?.method && (
                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded capitalize">
                                          {entry.dreamData.method}
                                        </span>
                                      )}
                                      {entry.dreamData?.context?.emotion && (
                                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                                          {entry.dreamData.context.emotion}
                                        </span>
                                      )}
                                      {entry.dreamData?.context?.dreamRole && (
                                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded">
                                          {entry.dreamData.context.dreamRole}
                                        </span>
                                      )}
                                      {entry.dreamData?.context?.characterType && (
                                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                                          {entry.dreamData.context.characterType}
                                        </span>
                                      )}
                                      {entry.dreamData?.context?.recurring && (
                                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                                          Повторяющийся
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {entry.notes && (
                                  <div className="text-sm text-slate-500 mt-2 line-clamp-1">
                                    Заметки: {entry.notes}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Unsaved Dreams (analysis_metadata) */}
                      {analysisMetadata.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <FileText size={18} className="text-yellow-400" />
                            Несохраненные анализы ({analysisMetadata.length})
                          </h4>
                          <div className="space-y-2">
                            {analysisMetadata.map((metadata) => (
                              <div
                                key={metadata.id}
                                className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-yellow-500/30 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="text-white font-medium line-clamp-2 mb-2">
                                      {metadata.dream_description || 'Без описания'}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      <span className="flex items-center gap-1 text-slate-400">
                                        <Clock size={12} />
                                        {new Date(metadata.timestamp).toLocaleString('ru-RU')}
                                      </span>
                                      {metadata.method && (
                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded capitalize">
                                          {metadata.method}
                                        </span>
                                      )}
                                      {metadata.emotion && (
                                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                                          {metadata.emotion}
                                        </span>
                                      )}
                                      {metadata.recurring && (
                                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                                          Повторяющийся
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {metadata.life_situation && (
                                  <div className="text-sm text-slate-400 mt-2 line-clamp-1">
                                    Ситуация: {metadata.life_situation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {dreamEntries.length === 0 && analysisMetadata.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                          <p>У пользователя пока нет снов</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Статистика пользователя</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                      <div className="text-sm text-slate-400 mb-1">Всего анализов</div>
                      <div className="text-2xl font-bold text-white">{analysisMetadata.length}</div>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                      <div className="text-sm text-slate-400 mb-1">Сохранено в журнал</div>
                      <div className="text-2xl font-bold text-white">{dreamEntries.length}</div>
                    </div>
                  </div>

                  {analysisMetadata.length > 0 && (
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                      <div className="text-sm text-slate-400 mb-3">Методы анализа</div>
                      <div className="space-y-2">
                        {Object.entries(
                          analysisMetadata.reduce((acc, m) => {
                            acc[m.method] = (acc[m.method] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([method, count]) => (
                          <div key={method} className="flex items-center justify-between">
                            <span className="text-white capitalize">{method}</span>
                            <span className="text-slate-400">{count} раз</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisMetadata.length > 0 && (
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                      <div className="text-sm text-slate-400 mb-3">Частые эмоции</div>
                      <div className="space-y-2">
                        {Object.entries(
                          analysisMetadata
                            .filter(m => m.emotion)
                            .reduce((acc, m) => {
                              acc[m.emotion] = (acc[m.emotion] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                        )
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([emotion, count]) => (
                            <div key={emotion} className="flex items-center justify-between">
                              <span className="text-white">{emotion}</span>
                              <span className="text-slate-400">{count} раз</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {analysisMetadata.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                      <p>Недостаточно данных для аналитики</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Balance Adjustment Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {balanceAction === 'credit' ? 'Пополнить баланс' : 'Списать с баланса'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBalanceModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                aria-label="Закрыть модальное окно"
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Сумма (₽)</label>
                <input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="1000"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Причина</label>
                <textarea
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="Укажите причину изменения баланса..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleBalanceAdjustment}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Применить
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;
