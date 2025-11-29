import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  DollarSign,
  Ban,
  CheckCircle,
  MoreVertical,
  Calendar,
  Mail,
  CreditCard,
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { getAllUsers, getUserBalance, type UserFilters } from '../services/adminService';
import { supabase } from '../services/supabaseClient';
import type { User } from '../types';

interface UserWithBalance extends User {
  balance?: number;
  dreamCount?: number; // Сны в журнале (dream_entries)
  totalDreams?: number; // Все проанализированные сны (analysis_metadata)
}

interface UserManagementProps {
  onViewUser: (user: UserWithBalance) => void;
  onBack?: () => void; // Optional back button callback
}

type SortField = 'name' | 'email' | 'role' | 'balance' | 'dreamCount' | 'totalDreams' | 'created_at';
type SortDirection = 'asc' | 'desc' | null;

const UserManagement: React.FC<UserManagementProps> = ({ onViewUser, onBack }) => {
  const [users, setUsers] = useState<UserWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    limit: 20,
    offset: 0
  });
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Расширенные фильтры
  const [advancedFilters, setAdvancedFilters] = useState({
    userName: '',
    userEmail: '',
    balanceFrom: '',
    balanceTo: '',
    totalDreamsFrom: '',
    totalDreamsTo: '',
    journalDreamsFrom: '',
    journalDreamsTo: ''
  });

  const usersPerPage = 20;

  useEffect(() => {
    loadUsers();
  }, [filters, currentPage]);

  const loadUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const offset = (currentPage - 1) * usersPerPage;
      const userFilters: UserFilters = {
        ...filters,
        limit: usersPerPage,
        offset: offset,
        search: searchQuery || undefined
      };

      const fetchedUsers = await getAllUsers(userFilters);

      // Load balances and dream counts for each user
      const usersWithBalances = await Promise.all(
        fetchedUsers.map(async (user) => {
          const balanceData = await getUserBalance(user.id);

          // Count dreams from dream_entries table (журнал)
          const { count: dreamCount } = await supabase
            .from('dream_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          // Count all analyzed dreams from analysis_metadata table (все сны)
          const { count: totalDreams } = await supabase
            .from('analysis_metadata')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          return {
            ...user,
            balance: balanceData?.balance || 0,
            dreamCount: dreamCount || 0,
            totalDreams: totalDreams || 0
          };
        })
      );

      setUsers(usersWithBalances);

      // Calculate total pages (simplified - in production should come from API)
      setTotalPages(Math.max(1, Math.ceil(usersWithBalances.length / usersPerPage)));

    } catch (err) {
      console.error('Error loading users:', err);
      setError('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered and sorted users
  const processedUsers = useMemo(() => {
    let result = [...users];

    // Apply advanced filters
    if (advancedFilters.userName) {
      const lowerFilter = advancedFilters.userName.toLowerCase();
      result = result.filter(user =>
        (user.name || user.email).toLowerCase().includes(lowerFilter)
      );
    }

    if (advancedFilters.userEmail) {
      const lowerFilter = advancedFilters.userEmail.toLowerCase();
      result = result.filter(user =>
        user.email.toLowerCase().includes(lowerFilter)
      );
    }

    // Balance range filter
    if (advancedFilters.balanceFrom) {
      const minBalance = parseFloat(advancedFilters.balanceFrom);
      result = result.filter(user => (user.balance || 0) >= minBalance);
    }
    if (advancedFilters.balanceTo) {
      const maxBalance = parseFloat(advancedFilters.balanceTo);
      result = result.filter(user => (user.balance || 0) <= maxBalance);
    }

    // Total dreams range filter
    if (advancedFilters.totalDreamsFrom) {
      const minDreams = parseInt(advancedFilters.totalDreamsFrom);
      result = result.filter(user => (user.totalDreams || 0) >= minDreams);
    }
    if (advancedFilters.totalDreamsTo) {
      const maxDreams = parseInt(advancedFilters.totalDreamsTo);
      result = result.filter(user => (user.totalDreams || 0) <= maxDreams);
    }

    // Journal dreams range filter
    if (advancedFilters.journalDreamsFrom) {
      const minJournal = parseInt(advancedFilters.journalDreamsFrom);
      result = result.filter(user => (user.dreamCount || 0) >= minJournal);
    }
    if (advancedFilters.journalDreamsTo) {
      const maxJournal = parseInt(advancedFilters.journalDreamsTo);
      result = result.filter(user => (user.dreamCount || 0) <= maxJournal);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortField) {
          case 'name':
            aVal = (a.name || a.email).toLowerCase();
            bVal = (b.name || b.email).toLowerCase();
            break;
          case 'email':
            aVal = a.email.toLowerCase();
            bVal = b.email.toLowerCase();
            break;
          case 'role':
            aVal = a.role || 'user';
            bVal = b.role || 'user';
            break;
          case 'balance':
            aVal = a.balance || 0;
            bVal = b.balance || 0;
            break;
          case 'dreamCount':
            aVal = a.dreamCount || 0;
            bVal = b.dreamCount || 0;
            break;
          case 'totalDreams':
            aVal = a.totalDreams || 0;
            bVal = b.totalDreams || 0;
            break;
          case 'created_at':
            aVal = new Date(a.created_at).getTime();
            bVal = new Date(b.created_at).getTime();
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [users, advancedFilters, sortField, sortDirection]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRoleColor = (role?: 'user' | 'admin') => {
    if (role === 'admin') {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const getRoleLabel = (role?: 'user' | 'admin') => {
    return role === 'admin' ? 'Администратор' : 'Пользователь';
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-slate-500" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp size={14} className="text-blue-400" />;
    }
    return <ArrowDown size={14} className="text-blue-400" />;
  };

  const SortableHeader: React.FC<{ field: SortField; label: string }> = ({ field, label }) => (
    <th className="px-6 py-4 text-left">
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider hover:text-blue-400 transition-colors"
      >
        {label}
        {getSortIcon(field)}
      </button>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Вернуться в админ-панель"
            className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="text-white" size={20} />
          </button>
        )}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Управление пользователями</h2>
            <p className="text-slate-400">Всего пользователей: {users.length}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => loadUsers(true)}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors flex items-center gap-2"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Обновление...' : 'Обновить данные'}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по email или имени..."
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <Search size={20} />
            Найти
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <Filter size={20} />
            Фильтры
          </button>
        </form>

        {/* Advanced Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* User Name Filter */}
              <div>
                <label htmlFor="filter-username" className="block text-sm text-slate-400 mb-2">
                  Пользователь
                </label>
                <input
                  id="filter-username"
                  type="text"
                  value={advancedFilters.userName}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, userName: e.target.value })}
                  placeholder="Имя или email..."
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Email Filter */}
              <div>
                <label htmlFor="filter-email" className="block text-sm text-slate-400 mb-2">
                  E-mail
                </label>
                <input
                  id="filter-email"
                  type="text"
                  value={advancedFilters.userEmail}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, userEmail: e.target.value })}
                  placeholder="Email..."
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Role Filter */}
              <div>
                <label htmlFor="filter-role" className="block text-sm text-slate-400 mb-2">
                  Роль
                </label>
                <select
                  id="filter-role"
                  value={filters.role || ''}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value as 'admin' | 'user' | undefined })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Все</option>
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>

              {/* Balance Range */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Баланс</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={advancedFilters.balanceFrom}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, balanceFrom: e.target.value })}
                    placeholder="От"
                    className="w-1/2 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    aria-label="Баланс от"
                  />
                  <input
                    type="number"
                    value={advancedFilters.balanceTo}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, balanceTo: e.target.value })}
                    placeholder="До"
                    className="w-1/2 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    aria-label="Баланс до"
                  />
                </div>
              </div>

              {/* Total Dreams Range */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Сны (всего)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={advancedFilters.totalDreamsFrom}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, totalDreamsFrom: e.target.value })}
                    placeholder="От"
                    className="w-1/2 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    aria-label="Сны от"
                  />
                  <input
                    type="number"
                    value={advancedFilters.totalDreamsTo}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, totalDreamsTo: e.target.value })}
                    placeholder="До"
                    className="w-1/2 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    aria-label="Сны до"
                  />
                </div>
              </div>

              {/* Journal Dreams Range */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Журнал</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={advancedFilters.journalDreamsFrom}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, journalDreamsFrom: e.target.value })}
                    placeholder="От"
                    className="w-1/2 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    aria-label="Журнал от"
                  />
                  <input
                    type="number"
                    value={advancedFilters.journalDreamsTo}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, journalDreamsTo: e.target.value })}
                    placeholder="До"
                    className="w-1/2 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    aria-label="Журнал до"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label htmlFor="filter-date-from" className="block text-sm text-slate-400 mb-2">
                  Дата регистрации (от)
                </label>
                <input
                  id="filter-date-from"
                  type="date"
                  value={filters.createdAfter || ''}
                  onChange={(e) => setFilters({ ...filters, createdAfter: e.target.value || undefined })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="filter-date-to" className="block text-sm text-slate-400 mb-2">
                  Дата регистрации (до)
                </label>
                <input
                  id="filter-date-to"
                  type="date"
                  value={filters.createdBefore || ''}
                  onChange={(e) => setFilters({ ...filters, createdBefore: e.target.value || undefined })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAdvancedFilters({
                    userName: '',
                    userEmail: '',
                    balanceFrom: '',
                    balanceTo: '',
                    totalDreamsFrom: '',
                    totalDreamsTo: '',
                    journalDreamsFrom: '',
                    journalDreamsTo: ''
                  });
                  setFilters({ ...filters, role: undefined, createdAfter: undefined, createdBefore: undefined });
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Загрузка пользователей...</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <SortableHeader field="name" label="Пользователь" />
                  <SortableHeader field="email" label="Email" />
                  <SortableHeader field="role" label="Роль" />
                  <SortableHeader field="balance" label="Баланс" />
                  <SortableHeader field="totalDreams" label="Сны" />
                  <SortableHeader field="dreamCount" label="Журнал" />
                  <SortableHeader field="created_at" label="Регистрация" />
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {processedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold overflow-hidden">
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
                        <div>
                          <div className="text-white font-medium">{user.name || 'Без имени'}</div>
                          <div className="text-sm text-slate-400">ID: {user.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail size={16} className="text-slate-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <CreditCard size={16} className="text-blue-400" />
                        {user.balance || 0} ₽
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-purple-400 font-medium">
                        <BookOpen size={16} />
                        {user.totalDreams || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-green-400 font-medium">
                        <BookOpen size={16} />
                        {user.dreamCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={16} />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => onViewUser(user)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                      >
                        <Eye size={16} />
                        Подробнее
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {processedUsers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Пользователи не найдены</p>
              <p className="text-slate-500 text-sm mt-2">Попробуйте изменить параметры поиска или фильтры</p>
            </div>
          )}

          {/* Pagination */}
          {users.length > 0 && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Страница {currentPage} из {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Назад
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  Вперед
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
