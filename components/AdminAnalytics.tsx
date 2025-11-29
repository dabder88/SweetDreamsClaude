import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, PieChart, CheckCircle, Clock, Calendar, FileText, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  getActivityByPeriod,
  getMethodUsageStats,
  getAPISuccessRate,
  getAverageDreamLength,
  getUsageByTimeOfDay,
  getUsageByDayOfWeek
} from '../services/adminService';
import type {
  ActivityDataPoint,
  MethodStats,
  APISuccessStats,
  TimeOfDayStats,
  DayOfWeekStats,
  DreamLengthStats,
  AnalyticsPeriod
} from '../types';

interface AdminAnalyticsProps {
  onBack: () => void;
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ onBack }) => {
  // Состояния для данных
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);
  const [methodStats, setMethodStats] = useState<MethodStats[]>([]);
  const [apiStats, setAPIStats] = useState<APISuccessStats[]>([]);
  const [dreamLengthStats, setDreamLengthStats] = useState<DreamLengthStats>({
    average: 0, median: 0, min: 0, max: 0, total: 0
  });
  const [timeOfDayData, setTimeOfDayData] = useState<TimeOfDayStats[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<DayOfWeekStats[]>([]);

  // Состояния для UI
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Загрузка данных
  useEffect(() => {
    loadAllData();
  }, [period]);

  const loadAllData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const [activity, methods, api, dreamLength, timeOfDay, dayOfWeek] = await Promise.all([
        getActivityByPeriod(period),
        getMethodUsageStats(),
        getAPISuccessRate(period),
        getAverageDreamLength(),
        getUsageByTimeOfDay(),
        getUsageByDayOfWeek()
      ]);

      setActivityData(activity);
      setMethodStats(methods);
      setAPIStats(api);
      setDreamLengthStats(dreamLength);
      setTimeOfDayData(timeOfDay);
      setDayOfWeekData(dayOfWeek);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Цвета для графиков
  const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

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
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-serif font-bold text-white">Аналитика</h1>
            <p className="text-slate-400 text-sm">Подробная статистика использования системы</p>
          </div>
          <button
            type="button"
            onClick={() => loadAllData(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Обновление...' : 'Обновить данные'}
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(['day', 'week', 'month', 'year', 'all'] as AnalyticsPeriod[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg transition-colors ${period === p
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
              {p === 'day' && 'День'}
              {p === 'week' && 'Неделя'}
              {p === 'month' && 'Месяц'}
              {p === 'year' && 'Год'}
              {p === 'all' && 'Всё время'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Загрузка аналитики...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Activity Graph */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-400" />
              Активность пользователей
            </h2>
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#10b981" name="Анализов" strokeWidth={2} />
                  <Line type="monotone" dataKey="users" stroke="#8b5cf6" name="Пользователей" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12">Нет данных для отображения</p>
            )}
          </div>

          {/* 2. Method Usage Pie Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <PieChart size={20} className="text-purple-400" />
              Популярность методов анализа
            </h2>
            {methodStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={methodStats}
                    dataKey="count"
                    nameKey="methodName"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {methodStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12">Нет данных для отображения</p>
            )}
          </div>

          {/* 3. API Success Rate */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-400" />
              Success Rate API
            </h2>
            {apiStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={apiStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  />
                  <Legend />
                  <Bar dataKey="successful" fill="#10b981" name="Успешные" />
                  <Bar dataKey="failed" fill="#ef4444" name="Ошибки" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12">Нет данных о метриках API</p>
            )}
          </div>

          {/* 4. Dream Length Stats */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-amber-400" />
              Статистика длины снов
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Средняя</p>
                <p className="text-2xl font-bold text-white">{dreamLengthStats.average}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Медиана</p>
                <p className="text-2xl font-bold text-white">{dreamLengthStats.median}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Минимум</p>
                <p className="text-2xl font-bold text-white">{dreamLengthStats.min}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Максимум</p>
                <p className="text-2xl font-bold text-white">{dreamLengthStats.max}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Всего снов</p>
                <p className="text-2xl font-bold text-white">{dreamLengthStats.total}</p>
              </div>
            </div>
          </div>

          {/* 5. Time of Day Usage */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-400" />
              Использование по времени суток
            </h2>
            {timeOfDayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeOfDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hourLabel" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" name="Анализов" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12">Нет данных для отображения</p>
            )}
          </div>

          {/* 6. Day of Week Usage */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-pink-400" />
              Использование по дням недели
            </h2>
            {dayOfWeekData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="dayName" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  />
                  <Bar dataKey="count" fill="#ec4899" name="Анализов" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12">Нет данных для отображения</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
