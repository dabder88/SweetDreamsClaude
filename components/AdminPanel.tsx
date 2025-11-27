import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, DollarSign, Settings as SettingsIcon, FileText } from 'lucide-react';
import UserManagement from './UserManagement';
import UserDetail from './UserDetail';
import AuditLog from './AuditLog';
import AdminAnalytics from './AdminAnalytics';
import type { User, JournalEntry } from '../types';
import {
  getSystemStats,
  getTodayAnalysesCount,
  getMonthlyRevenue,
  getTotalDreamEntries
} from '../services/adminService';

interface AdminPanelProps {
  onNavigate: (view: string) => void;
  currentView?: string; // Current sub-view from App.tsx
  onViewChange?: (view: string) => void; // Callback to change view
  onViewDream?: (entry: JournalEntry) => void; // Callback to view dream details
  currentUser?: User; // Current logged-in admin
}

interface UserWithBalance extends User {
  balance?: number;
  dreamCount?: number;
}

type AdminView = 'overview' | 'users' | 'user-detail' | 'finances' | 'analytics' | 'audit';

const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate, currentView: propView, onViewChange, onViewDream, currentUser }) => {
  // Use prop view if provided, otherwise use local state
  const [localView, setLocalView] = useState<AdminView>('overview');
  const currentView = (propView as AdminView) || localView;
  const setCurrentView = onViewChange || setLocalView;

  const [selectedUser, setSelectedUser] = useState<UserWithBalance | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Key to force refresh UserManagement

  // Statistics state
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [todayAnalyses, setTodayAnalyses] = useState<number>(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Load statistics on component mount
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [systemStats, todayCount, revenue, entries] = await Promise.all([
          getSystemStats(),
          getTodayAnalysesCount(),
          getMonthlyRevenue(),
          getTotalDreamEntries()
        ]);

        setTotalUsers(systemStats.totalUsers);
        setTodayAnalyses(todayCount);
        setMonthlyRevenue(revenue);
        setTotalEntries(entries);
      } catch (err) {
        console.error('Error loading admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentView === 'overview') {
      loadStats();
    }
  }, [currentView]);

  const handleViewUser = (user: UserWithBalance) => {
    setSelectedUser(user);
    setCurrentView('user-detail');
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setCurrentView('users');
  };

  const handleBackToOverview = () => {
    setSelectedUser(null);
    setCurrentView('overview');
  };

  const handleUserUpdate = () => {
    // Force refresh UserManagement by incrementing key
    setRefreshKey(prev => prev + 1);
  };

  // Render user detail view
  if (currentView === 'user-detail' && selectedUser) {
    return (
      <UserDetail
        user={selectedUser}
        onBack={handleBackToUsers}
        onUserUpdate={handleUserUpdate}
        onViewDream={onViewDream}
        currentAdminId={currentUser?.id}
      />
    );
  }

  // Render user management view
  if (currentView === 'users') {
    return (
      <UserManagement
        key={refreshKey}
        onViewUser={handleViewUser}
        onBack={handleBackToOverview}
      />
    );
  }

  // Render audit log view
  if (currentView === 'audit') {
    return (
      <AuditLog
        onBack={handleBackToOverview}
      />
    );
  }

  // Render analytics view
  if (currentView === 'analytics') {
    return (
      <AdminAnalytics
        onBack={handleBackToOverview}
      />
    );
  }

  // Render overview (default)
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-white">Панель администратора</h1>
            <p className="text-slate-400 text-sm">Управление системой PsyDream</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Users className="text-indigo-400" size={20} />
            </div>
            <span className="text-2xl font-bold text-white">
              {loading ? '...' : totalUsers.toLocaleString()}
            </span>
          </div>
          <h3 className="text-slate-400 text-sm">Всего пользователей</h3>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Activity className="text-emerald-400" size={20} />
            </div>
            <span className="text-2xl font-bold text-white">
              {loading ? '...' : todayAnalyses.toLocaleString()}
            </span>
          </div>
          <h3 className="text-slate-400 text-sm">Анализов сегодня</h3>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="text-amber-400" size={20} />
            </div>
            <span className="text-2xl font-bold text-white">
              {loading ? '...' : `${monthlyRevenue.toLocaleString()} ₽`}
            </span>
          </div>
          <h3 className="text-slate-400 text-sm">Выручка за месяц</h3>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <FileText className="text-purple-400" size={20} />
            </div>
            <span className="text-2xl font-bold text-white">
              {loading ? '...' : totalEntries.toLocaleString()}
            </span>
          </div>
          <h3 className="text-slate-400 text-sm">Всего записей</h3>
        </div>
      </div>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <button
          onClick={() => setCurrentView('users')}
          className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-indigo-500/50 transition-all text-left"
        >
          <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-500/30 transition-colors">
            <Users className="text-indigo-400" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Пользователи</h3>
          <p className="text-slate-400 text-sm">
            Управление пользователями, роли, балансы
          </p>
        </button>

        {/* Analytics */}
        <button
          onClick={() => setCurrentView('analytics')}
          className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-all text-left"
        >
          <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/30 transition-colors">
            <Activity className="text-emerald-400" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Аналитика</h3>
          <p className="text-slate-400 text-sm">
            Статистика использования и графики
          </p>
        </button>

        {/* Financial Management */}
        <button
          onClick={() => console.log('Navigate to Finances')}
          className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-amber-500/50 transition-all text-left"
        >
          <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-500/30 transition-colors">
            <DollarSign className="text-amber-400" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Финансы</h3>
          <p className="text-slate-400 text-sm">
            Транзакции, балансы, выручка
          </p>
        </button>

        {/* Audit Log */}
        <button
          onClick={() => setCurrentView('audit')}
          className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all text-left"
        >
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
            <FileText className="text-purple-400" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Журнал действий</h3>
          <p className="text-slate-400 text-sm">
            История административных действий
          </p>
        </button>

        {/* AI Providers (Placeholder) */}
        <button
          onClick={() => console.log('Navigate to AI Providers')}
          className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all text-left"
        >
          <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
            <Activity className="text-cyan-400" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">AI-провайдеры</h3>
          <p className="text-slate-400 text-sm">
            Управление подключениями к AI (скоро)
          </p>
        </button>

        {/* System Settings */}
        <button
          onClick={() => console.log('Navigate to System Settings')}
          className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-rose-500/50 transition-all text-left"
        >
          <div className="w-12 h-12 bg-rose-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-rose-500/30 transition-colors">
            <SettingsIcon className="text-rose-400" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Системные настройки</h3>
          <p className="text-slate-400 text-sm">
            Конфигурация системы, лимиты, режимы
          </p>
        </button>
      </div>

      {/* Coming Soon Notice */}
      <div className="mt-8 bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-indigo-300 mb-2">В разработке</h3>
        <p className="text-slate-400 text-sm">
          Это базовая структура административной панели. Подробные функции по управлению пользователями,
          финансами и аналитикой будут реализованы на следующих этапах.
        </p>
      </div>
    </div>
  );
};

export default AdminPanel;
