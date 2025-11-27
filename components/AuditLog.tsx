import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Calendar, User, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AuditLogEntry, AdminActionType } from '../types';
import { getAuditLogs, type LogFilters } from '../services/adminService';

interface AuditLogProps {
  onBack: () => void;
}

const AuditLog: React.FC<AuditLogProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<AdminActionType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load audit logs
  useEffect(() => {
    loadLogs();
  }, [currentPage, selectedActionType, dateFrom, dateTo]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filters: LogFilters = {
        actionType: selectedActionType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      };

      const data = await getAuditLogs(filters);
      setLogs(data);

      // Calculate total pages (approximate, since we don't have total count)
      setTotalPages(Math.ceil(data.length / itemsPerPage) || 1);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedActionType('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Format action type for display
  const formatActionType = (action: AdminActionType): string => {
    const translations: Record<AdminActionType, string> = {
      USER_DELETED: 'Удаление пользователя',
      USER_ROLE_CHANGED: 'Изменение роли',
      BALANCE_CREDITED: 'Начисление баланса',
      BALANCE_DEBITED: 'Списание баланса',
      PROVIDER_CHANGED: 'Изменение провайдера',
      SETTINGS_UPDATED: 'Обновление настроек',
      LOGIN: 'Вход в систему',
      LOGOUT: 'Выход из системы'
    };
    return translations[action] || action;
  };

  // Get icon color based on action type
  const getActionColor = (action: AdminActionType): string => {
    switch (action) {
      case 'USER_DELETED':
      case 'BALANCE_DEBITED':
        return 'text-red-400 bg-red-500/20';
      case 'USER_ROLE_CHANGED':
        return 'text-purple-400 bg-purple-500/20';
      case 'BALANCE_CREDITED':
        return 'text-green-400 bg-green-500/20';
      case 'SETTINGS_UPDATED':
      case 'PROVIDER_CHANGED':
        return 'text-blue-400 bg-blue-500/20';
      case 'LOGIN':
      case 'LOGOUT':
        return 'text-slate-400 bg-slate-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Filter logs by search query
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.admin_id?.toLowerCase().includes(query) ||
      log.target_user_id?.toLowerCase().includes(query) ||
      JSON.stringify(log.details).toLowerCase().includes(query)
    );
  });

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

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-white">Журнал действий</h1>
            <p className="text-slate-400 text-sm">История административных действий</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по ID пользователя, деталям..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showFilters
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Filter size={20} />
            Фильтры
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action Type Filter */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Тип действия</label>
              <select
                value={selectedActionType}
                onChange={(e) => setSelectedActionType(e.target.value as AdminActionType | '')}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="">Все типы</option>
                <option value="USER_ROLE_CHANGED">Изменение роли</option>
                <option value="USER_DELETED">Удаление пользователя</option>
                <option value="BALANCE_CREDITED">Начисление баланса</option>
                <option value="BALANCE_DEBITED">Списание баланса</option>
                <option value="SETTINGS_UPDATED">Обновление настроек</option>
                <option value="PROVIDER_CHANGED">Изменение провайдера</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Дата от</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Дата до</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Reset Button */}
            <div className="md:col-span-3 flex justify-end">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-slate-400">
        Найдено записей: <span className="text-white font-medium">{filteredLogs.length}</span>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Загрузка журнала...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
          <Shield className="mx-auto mb-4 text-slate-600" size={48} />
          <p className="text-slate-400">Нет записей в журнале</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActionColor(log.action_type)}`}>
                  <Shield size={20} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-medium mb-1">
                        {formatActionType(log.action_type)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(log.created_at)}
                        </span>
                        {log.details?.admin_email && (
                          <span className="flex items-center gap-1">
                            <Shield size={14} />
                            Админ: <span className="text-purple-400">{log.details.admin_email}</span>
                          </span>
                        )}
                        {log.details?.target_email && (
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            Пользователь: <span className="text-indigo-400">{log.details.target_email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details - Simplified */}
                  {log.details && (
                    <div className="mt-2 space-y-1">
                      {log.details.from && log.details.to && (
                        <div className="text-sm text-slate-300">
                          <span className="text-slate-500">Роль изменена:</span> {log.details.from} → {log.details.to}
                        </div>
                      )}
                      {log.details.amount && (
                        <div className="text-sm text-slate-300">
                          <span className="text-slate-500">Сумма:</span> {Number(log.details.amount).toLocaleString()} ₽
                        </div>
                      )}
                      {log.details.reason && (
                        <div className="text-sm text-slate-300">
                          <span className="text-slate-500">Причина:</span> {log.details.reason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredLogs.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-white rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-white rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
