import { supabase } from './supabaseClient';
import {
  User,
  AdminActionType,
  AuditLogEntry,
  UserBalance,
  Transaction,
  TransactionType,
  TransactionStatus,
  UsageMetric,
  ActivityDataPoint,
  MethodStats,
  APISuccessStats,
  TimeOfDayStats,
  DayOfWeekStats,
  DreamLengthStats,
  AnalyticsPeriod,
  PsychMethod,
  AIProviderConfig,
  AIModel,
  AIProviderType,
  AITaskType
} from '../types';
import { PSYCH_METHODS } from '../constants';

// Re-export types that are commonly used
export { TransactionType, TransactionStatus };
export type { Transaction };

// =====================================================
// FILTER TYPES
// =====================================================

export interface UserFilters {
  search?: string;
  hasBalance?: boolean;
  dateFrom?: string;
  dateTo?: string;
  role?: 'user' | 'admin';
  limit?: number;
  offset?: number;
}

export interface TransactionFilters {
  userId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  adminId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface BalanceFilters {
  minBalance?: number;
  maxBalance?: number;
  currency?: string;
}

export interface LogFilters {
  adminId?: string;
  actionType?: AdminActionType;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface MetricFilters {
  userId?: string;
  actionType?: 'dream_analysis' | 'image_generation' | 'archetype_analysis';
  dateFrom?: string;
  dateTo?: string;
  success?: boolean;
  limit?: number;
  offset?: number;
}

export interface FinancialStats {
  totalRevenue: number;
  paidUsersCount: number;
  totalTransactions: number;
  avgTransaction: number;
  conversionRate: number;
  revenueByPeriod: { date: string; amount: number }[];
}

export interface SystemStats {
  totalUsers: number;
  newUsers24h: number;
  newUsers7d: number;
  newUsers30d: number;
  activeUsers: number;
  confirmedEmailPercent: number;
  totalAnalyses: number;
  totalImages: number;
  totalArchetypeAnalyses: number;
  avgAnalysisTime: number;
  apiSuccessRate: number;
}

export interface UserDetails extends User {
  totalAnalyses: number;
  totalImages: number;
  firstAnalysisDate?: string;
  lastAnalysisDate?: string;
  mostUsedMethod?: string;
  avgDreamLength?: number;
  dreamEntries?: any[]; // Full dream entries for admin review
}

// =====================================================
// ADMIN ROLE MANAGEMENT
// =====================================================

/**
 * Get user role from admin_users table
 * Has a 3 second timeout to prevent blocking app loading
 */
export const getUserRole = async (userId: string): Promise<'user' | 'admin'> => {
  try {
    // Add timeout to prevent infinite waiting
    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 3000)
    );

    const queryPromise = supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .single();

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error || !data) {
      return 'user';
    }

    const role = data.role === 'admin' ? 'admin' : 'user';
    return role;
  } catch (err) {
    console.error('Error fetching user role:', err);
    return 'user';
  }
};

/**
 * Check if user is an admin
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  const role = await getUserRole(userId);
  return role === 'admin';
};

/**
 * Check if email is in admin list (from env) and promote to admin if needed
 * @param email User email to check
 * @returns true if user was promoted to admin, false otherwise
 */
export const checkAndPromoteAdmin = async (email: string): Promise<boolean> => {
  try {
    // Get admin emails from environment variable
    const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS || '';
    const adminEmails = adminEmailsEnv.split(',').map((e: string) => e.trim().toLowerCase());

    if (!adminEmails.includes(email.toLowerCase())) {
      return false;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    // Check if already admin
    const existingRole = await getUserRole(user.id);
    if (existingRole === 'admin') {
      return true;
    }

    // Promote to admin
    const { error } = await supabase
      .from('admin_users')
      .insert({
        user_id: user.id,
        role: 'admin'
      });

    if (error) {
      console.error('Error promoting user to admin:', error);
      return false;
    }

    // Log the promotion
    await logAdminAction(AdminActionType.USER_ROLE_CHANGED, {
      target_user_id: user.id,
      email: email,
      new_role: 'admin',
      auto_promoted: true
    });

    return true;
  } catch (err) {
    console.error('Error in checkAndPromoteAdmin:', err);
    return false;
  }
};

// =====================================================
// USER MANAGEMENT
// =====================================================

/**
 * Get all users with optional filtering
 */
export const getAllUsers = async (filters?: UserFilters): Promise<User[]> => {
  try {
    // Call RPC function to get all users (admin only)
    // This function now returns is_admin flag directly, bypassing RLS
    const { data, error } = await supabase.rpc('get_all_users');

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    // Transform to User type
    // Role is now determined by is_admin field from the RPC function
    const users: User[] = (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      name: u.raw_user_meta_data?.name,
      avatar_url: u.raw_user_meta_data?.avatar_url,
      gender: u.raw_user_meta_data?.gender,
      date_of_birth: u.raw_user_meta_data?.date_of_birth,
      privacy_hide_dreams: u.raw_user_meta_data?.privacy_hide_dreams || false,
      role: u.is_admin ? 'admin' : 'user' // Use is_admin from RPC result
    }));

    // Apply search filter (client-side for simplicity)
    let filteredUsers = users;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchLower) ||
        u.name?.toLowerCase().includes(searchLower) ||
        u.id.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (filters?.role) {
      filteredUsers = filteredUsers.filter(u => u.role === filters.role);
    }

    return filteredUsers;
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    return [];
  }
};

/**
 * Get detailed user information including statistics
 */
export const getUserDetails = async (userId: string): Promise<UserDetails | null> => {
  try {
    // Get basic user info via RPC
    const { data: userDataArray, error: userError } = await supabase.rpc('get_user_by_id', {
      target_user_id: userId
    });

    if (userError || !userDataArray || userDataArray.length === 0) {
      console.error('Error fetching user:', userError);
      return null;
    }

    const userData = userDataArray[0];

    // Get user role
    const role = await getUserRole(userId);

    // Get analysis statistics
    const { data: analysisData } = await supabase
      .from('analysis_metadata')
      .select('*')
      .eq('user_id', userId);

    const analyses = analysisData || [];
    const totalAnalyses = analyses.length;

    const dreamAnalyses = analyses.filter(a => a.method !== 'archetype');
    const imageAnalyses = analyses.filter(a => a.dream_description?.includes('изображение'));
    const archetypeAnalyses = analyses.filter(a => a.method === 'archetype');

    const firstAnalysis = analyses.length > 0 ? analyses[analyses.length - 1] : null;
    const lastAnalysis = analyses.length > 0 ? analyses[0] : null;

    // Calculate most used method
    const methodCounts: Record<string, number> = {};
    dreamAnalyses.forEach(a => {
      methodCounts[a.method] = (methodCounts[a.method] || 0) + 1;
    });
    const mostUsedMethod = Object.keys(methodCounts).length > 0
      ? Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0][0]
      : undefined;

    // Get dream entries
    const { data: dreamEntries } = await supabase
      .from('dream_entries')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(20); // Limit to 20 most recent

    const userDetails: UserDetails = {
      id: userData.id,
      email: userData.email,
      created_at: userData.created_at,
      name: userData.raw_user_meta_data?.name,
      avatar_url: userData.raw_user_meta_data?.avatar_url,
      gender: userData.raw_user_meta_data?.gender,
      date_of_birth: userData.raw_user_meta_data?.date_of_birth,
      role,
      totalAnalyses,
      totalImages: imageAnalyses.length,
      firstAnalysisDate: firstAnalysis?.created_at,
      lastAnalysisDate: lastAnalysis?.created_at,
      mostUsedMethod,
      dreamEntries: dreamEntries || []
    };

    return userDetails;
  } catch (err) {
    console.error('Error in getUserDetails:', err);
    return null;
  }
};

/**
 * Delete user and all associated data
 */
export const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Delete user from Supabase Auth
    // Note: This requires admin privileges in Supabase
    // For now, we'll just delete from our tables
    // TODO: Implement proper user deletion via Supabase Admin API

    const { error } = await supabase
      .from('dream_entries')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting user data:', error);
      return { success: false, error: error.message };
    }

    // Log the action
    await logAdminAction(AdminActionType.USER_DELETED, {
      target_user_id: userId
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error in deleteUser:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
};

// =====================================================
// FINANCIAL MANAGEMENT
// =====================================================

/**
 * Get user balance
 * Has a 3 second timeout to prevent blocking app loading
 */
export const getUserBalance = async (userId: string): Promise<UserBalance | null> => {
  try {
    // Add timeout to prevent infinite waiting
    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 3000)
    );

    const queryPromise = supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no row exists

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      // Log 406 errors with more details for debugging
      if (error.code === '406' || error.message?.includes('406')) {
        console.warn(`[getUserBalance] 406 error for user ${userId}:`, error);
        console.warn('[getUserBalance] This usually means RLS is blocking access. Check admin_users table.');
      } else if (error.code !== 'PGRST116' && error.message !== 'Timeout') {
        // Only log errors that are not "not found" or timeout
        console.error('Error fetching user balance:', error);
      }
      return null;
    }

    return data as UserBalance || null;
  } catch (err) {
    console.error('Error in getUserBalance:', err);
    return null;
  }
};

/**
 * Get all user balances with filters
 */
export const getAllBalances = async (filters?: BalanceFilters): Promise<UserBalance[]> => {
  try {
    let query = supabase
      .from('user_balances')
      .select('*');

    if (filters?.minBalance !== undefined) {
      query = query.gte('balance', filters.minBalance);
    }
    if (filters?.maxBalance !== undefined) {
      query = query.lte('balance', filters.maxBalance);
    }
    if (filters?.currency) {
      query = query.eq('currency', filters.currency);
    }

    query = query.order('balance', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching balances:', error);
      return [];
    }

    return data as UserBalance[] || [];
  } catch (err) {
    console.error('Error in getAllBalances:', err);
    return [];
  }
};

/**
 * Credit user balance (add funds manually)
 */
export const creditUserBalance = async (
  userId: string,
  amount: number,
  description: string,
  adminId: string
): Promise<Transaction | null> => {
  try {
    // Get current balance or create new
    let balance = await getUserBalance(userId);
    const balanceBefore = balance?.balance || 0;
    const balanceAfter = balanceBefore + amount;

    if (!balance) {
      // Create new balance record
      const { error: createError } = await supabase
        .from('user_balances')
        .insert({
          user_id: userId,
          balance: balanceAfter,
          currency: 'RUB'
        });

      if (createError) {
        console.error('Error creating balance:', createError);
        return null;
      }
    } else {
      // Update existing balance
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating balance:', updateError);
        return null;
      }
    }

    // Create transaction record
    const transaction: Omit<Transaction, 'id' | 'created_at'> = {
      user_id: userId,
      type: TransactionType.MANUAL_CREDIT,
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: TransactionStatus.SUCCESS,
      description,
      admin_id: adminId,
      metadata: { operation: 'manual_credit' }
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return null;
    }

    // Log admin action
    await logAdminAction(AdminActionType.BALANCE_CREDITED, {
      target_user_id: userId,
      amount,
      description,
      balance_before: balanceBefore,
      balance_after: balanceAfter
    });

    return data as Transaction;
  } catch (err) {
    console.error('Error in creditUserBalance:', err);
    return null;
  }
};

/**
 * Debit user balance (remove funds manually)
 */
export const debitUserBalance = async (
  userId: string,
  amount: number,
  description: string,
  adminId: string
): Promise<Transaction | null> => {
  try {
    // Get current balance
    const balance = await getUserBalance(userId);
    if (!balance) {
      console.error('User balance not found');
      return null;
    }

    const balanceBefore = balance.balance;
    const balanceAfter = balanceBefore - amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('user_balances')
      .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating balance:', updateError);
      return null;
    }

    // Create transaction record
    const transaction: Omit<Transaction, 'id' | 'created_at'> = {
      user_id: userId,
      type: TransactionType.MANUAL_DEBIT,
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: TransactionStatus.SUCCESS,
      description,
      admin_id: adminId,
      metadata: { operation: 'manual_debit' }
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return null;
    }

    // Log admin action
    await logAdminAction(AdminActionType.BALANCE_DEBITED, {
      target_user_id: userId,
      amount,
      description,
      balance_before: balanceBefore,
      balance_after: balanceAfter
    });

    return data as Transaction;
  } catch (err) {
    console.error('Error in debitUserBalance:', err);
    return null;
  }
};

/**
 * Adjust user balance (universal function for credit/debit)
 * @param userId - User ID
 * @param amount - Amount to adjust (positive for credit, will be made positive for debit)
 * @param type - Transaction type (ADMIN_CREDIT or ADMIN_DEBIT)
 * @param description - Reason for adjustment
 */
export const adjustBalance = async (
  userId: string,
  amount: number,
  type: TransactionType,
  description: string
): Promise<Transaction | null> => {
  try {
    // Get current admin user
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) {
      console.error('No admin user found');
      return null;
    }

    // Ensure amount is positive
    const positiveAmount = Math.abs(amount);

    // Call appropriate function based on type
    if (type === TransactionType.ADMIN_CREDIT || type === TransactionType.MANUAL_CREDIT) {
      return await creditUserBalance(userId, positiveAmount, description, adminUser.id);
    } else if (type === TransactionType.ADMIN_DEBIT || type === TransactionType.MANUAL_DEBIT) {
      return await debitUserBalance(userId, positiveAmount, description, adminUser.id);
    } else {
      console.error('Invalid transaction type for adjustBalance:', type);
      return null;
    }
  } catch (err) {
    console.error('Error in adjustBalance:', err);
    return null;
  }
};

/**
 * Get transactions with filters
 */
export const getTransactions = async (filters?: TransactionFilters): Promise<Transaction[]> => {
  try {
    let query = supabase
      .from('transactions')
      .select('*');

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.adminId) {
      query = query.eq('admin_id', filters.adminId);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data as Transaction[] || [];
  } catch (err) {
    console.error('Error in getTransactions:', err);
    return [];
  }
};

/**
 * Get transactions for a specific user
 */
export const getUserTransactions = async (userId: string, limit = 10): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }

    return data as Transaction[] || [];
  } catch (err) {
    console.error('Error in getUserTransactions:', err);
    return [];
  }
};

/**
 * Get financial statistics
 */
export const getFinancialStats = async (): Promise<FinancialStats> => {
  try {
    // Get all successful transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'success')
      .in('type', ['deposit', 'purchase', 'manual_credit']);

    const allTransactions = transactions || [];
    const totalRevenue = allTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalTransactions = allTransactions.length;
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Get paid users count (users with transactions)
    const paidUserIds = new Set(allTransactions.map(t => t.user_id));
    const paidUsersCount = paidUserIds.size;

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    const conversionRate = totalUsers && totalUsers > 0 ? (paidUsersCount / totalUsers) * 100 : 0;

    // Get revenue by period (last 30 days)
    const revenueByPeriod: { date: string; amount: number }[] = [];
    // TODO: Implement daily revenue aggregation

    return {
      totalRevenue,
      paidUsersCount,
      totalTransactions,
      avgTransaction,
      conversionRate,
      revenueByPeriod
    };
  } catch (err) {
    console.error('Error in getFinancialStats:', err);
    return {
      totalRevenue: 0,
      paidUsersCount: 0,
      totalTransactions: 0,
      avgTransaction: 0,
      conversionRate: 0,
      revenueByPeriod: []
    };
  }
};

/**
 * Get today's analysis count
 */
export const getTodayAnalysesCount = async (): Promise<number> => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const { count } = await supabase
      .from('analysis_metadata')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    return count || 0;
  } catch (err) {
    console.error('Error in getTodayAnalysesCount:', err);
    return 0;
  }
};

/**
 * Get monthly revenue (current month)
 */
export const getMonthlyRevenue = async (): Promise<number> => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('status', 'success')
      .in('type', ['deposit', 'purchase', 'manual_credit'])
      .gte('created_at', monthStart.toISOString());

    const totalRevenue = (transactions || []).reduce((sum, t) => sum + Number(t.amount), 0);
    return totalRevenue;
  } catch (err) {
    console.error('Error in getMonthlyRevenue:', err);
    return 0;
  }
};

/**
 * Get total dream entries count
 */
export const getTotalDreamEntries = async (): Promise<number> => {
  try {
    const { count } = await supabase
      .from('dream_entries')
      .select('*', { count: 'exact', head: true });

    return count || 0;
  } catch (err) {
    console.error('Error in getTotalDreamEntries:', err);
    return 0;
  }
};

// =====================================================
// AUDIT LOG
// =====================================================

/**
 * Log admin action
 */
export const logAdminAction = async (
  actionType: AdminActionType,
  details: any
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('audit_log')
      .insert({
        admin_id: user.id,
        action_type: actionType,
        target_user_id: details.target_user_id,
        details
      });
  } catch (err) {
    console.error('Error logging admin action:', err);
  }
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters?: LogFilters): Promise<AuditLogEntry[]> => {
  try {
    let query = supabase
      .from('audit_log')
      .select('*');

    if (filters?.adminId) {
      query = query.eq('admin_id', filters.adminId);
    }
    if (filters?.actionType) {
      query = query.eq('action_type', filters.actionType);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    const logs = data as AuditLogEntry[] || [];

    // Enrich logs with admin emails
    const { data: allUsers } = await supabase.rpc('get_all_users');
    const userMap = new Map((allUsers || []).map((u: any) => [u.id, u.email]));

    return logs.map(log => ({
      ...log,
      details: {
        ...log.details,
        admin_email: userMap.get(log.admin_id) || 'Unknown',
        target_email: log.details?.target_email || (log.target_user_id ? userMap.get(log.target_user_id) : null)
      }
    }));
  } catch (err) {
    console.error('Error in getAuditLogs:', err);
    return [];
  }
};

// =====================================================
// METRICS AND ANALYTICS
// =====================================================

/**
 * Get usage metrics with filters
 */
export const getUsageMetrics = async (filters?: MetricFilters): Promise<UsageMetric[]> => {
  try {
    let query = supabase
      .from('usage_metrics')
      .select('*');

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.actionType) {
      query = query.eq('action_type', filters.actionType);
    }
    if (filters?.success !== undefined) {
      query = query.eq('success', filters.success);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const limit = filters?.limit || 1000;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching metrics:', error);
      return [];
    }

    return data as UsageMetric[] || [];
  } catch (err) {
    console.error('Error in getUsageMetrics:', err);
    return [];
  }
};

/**
 * Get system statistics
 */
export const getSystemStats = async (): Promise<SystemStats> => {
  try {
    // Get all users via RPC function (bypasses RLS)
    const { data: allUsersData, error: usersError } = await supabase.rpc('get_all_users');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    const allUsers = allUsersData || [];
    const totalUsers = allUsers.length;

    // Calculate new users in different periods
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newUsers24h = allUsers.filter(u => new Date(u.created_at) >= yesterday).length;
    const newUsers7d = allUsers.filter(u => new Date(u.created_at) >= weekAgo).length;
    const newUsers30d = allUsers.filter(u => new Date(u.created_at) >= monthAgo).length;

    // Get active users (users with at least 1 analysis)
    const { data: analysisData } = await supabase
      .from('analysis_metadata')
      .select('user_id');

    const activeUsers = new Set((analysisData || []).map(a => a.user_id)).size;

    // Get email confirmation percentage
    // TODO: Implement email confirmation tracking

    // Get analysis statistics
    const { data: allAnalyses } = await supabase
      .from('analysis_metadata')
      .select('*');

    const analyses = allAnalyses || [];
    const totalAnalyses = analyses.filter(a => a.method !== 'archetype').length;
    const totalImages = 0; // TODO: Track image generations
    const totalArchetypeAnalyses = analyses.filter(a => a.method === 'archetype').length;

    // Get API success rate from usage_metrics
    const { data: metrics } = await supabase
      .from('usage_metrics')
      .select('success');

    const metricsData = metrics || [];
    const successCount = metricsData.filter(m => m.success).length;
    const apiSuccessRate = metricsData.length > 0 ? (successCount / metricsData.length) * 100 : 100;

    return {
      totalUsers,
      newUsers24h,
      newUsers7d,
      newUsers30d,
      activeUsers,
      confirmedEmailPercent: 0, // TODO
      totalAnalyses,
      totalImages,
      totalArchetypeAnalyses,
      avgAnalysisTime: 0, // TODO
      apiSuccessRate
    };
  } catch (err) {
    console.error('Error in getSystemStats:', err);
    return {
      totalUsers: 0,
      newUsers24h: 0,
      newUsers7d: 0,
      newUsers30d: 0,
      activeUsers: 0,
      confirmedEmailPercent: 0,
      totalAnalyses: 0,
      totalImages: 0,
      totalArchetypeAnalyses: 0,
      avgAnalysisTime: 0,
      apiSuccessRate: 0
    };
  }
};

// =====================================================
// USER DREAM HISTORY
// =====================================================

/**
 * Get all analysis metadata for a specific user (unsaved dreams)
 */
export const getUserAnalysisMetadata = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('analysis_metadata')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching user analysis metadata:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getUserAnalysisMetadata:', err);
    return [];
  }
};

/**
 * Get all dream entries for a specific user (saved dreams with full analysis)
 */
export const getUserDreamEntries = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('dream_entries')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching user dream entries:', error);
      return [];
    }

    // Transform snake_case to camelCase for TypeScript compatibility
    return (data || []).map(entry => ({
      id: entry.id,
      user_id: entry.user_id,
      timestamp: entry.timestamp,
      dreamData: entry.dream_data,
      analysis: entry.analysis,
      imageUrl: entry.image_url,
      notes: entry.notes
    }));
  } catch (err) {
    console.error('Error in getUserDreamEntries:', err);
    return [];
  }
};

// =====================================================
// ROLE MANAGEMENT
// =====================================================

/**
 * Promote a regular user to admin role
 * Only callable by existing admins
 * Logs action to audit_log
 */
export const promoteToAdmin = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('promote_user_to_admin', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error promoting user to admin:', error);
      return { success: false, error: error.message };
    }

    // Check if the RPC function returned an error
    if (data && !data.success) {
      return { success: false, error: data.error || 'Failed to promote user' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in promoteToAdmin:', err);
    return { success: false, error: 'Ошибка при назначении администратора' };
  }
};

/**
 * Demote an admin to regular user role
 * Only callable by existing admins
 * Cannot remove the last admin (system protection)
 * Logs action to audit_log
 */
export const demoteFromAdmin = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('demote_admin_to_user', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error demoting admin to user:', error);
      return { success: false, error: error.message };
    }

    // Check if the RPC function returned an error
    if (data && !data.success) {
      return { success: false, error: data.error || 'Failed to demote user' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in demoteFromAdmin:', err);
    return { success: false, error: 'Ошибка при снятии роли администратора' };
  }
};

// =====================================================
// ANALYTICS FUNCTIONS
// =====================================================

/**
 * Get user activity statistics by period
 */
export const getActivityByPeriod = async (
  period: AnalyticsPeriod = 'month'
): Promise<ActivityDataPoint[]> => {
  try {
    // Определяем временной диапазон
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Начало эпохи Unix
    }

    // Получаем данные из analysis_metadata
    const { data, error } = await supabase
      .from('analysis_metadata')
      .select('created_at, user_id')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Группируем по дням
    const groupedByDay = new Map<string, Set<string>>();

    (data || []).forEach(item => {
      const date = new Date(item.created_at);
      const dateKey = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!groupedByDay.has(dateKey)) {
        groupedByDay.set(dateKey, new Set());
      }
      groupedByDay.get(dateKey)!.add(item.user_id);
    });

    // Подсчитываем общее количество анализов
    const analysisCountByDay = new Map<string, number>();
    (data || []).forEach(item => {
      const date = new Date(item.created_at);
      const dateKey = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      analysisCountByDay.set(dateKey, (analysisCountByDay.get(dateKey) || 0) + 1);
    });

    // Преобразуем в массив
    const result: ActivityDataPoint[] = Array.from(groupedByDay.entries()).map(([date, userIds]) => ({
      date,
      count: analysisCountByDay.get(date) || 0, // Общее количество анализов
      users: userIds.size // Количество уникальных пользователей
    }));

    return result;
  } catch (err) {
    console.error('Error in getActivityByPeriod:', err);
    return [];
  }
};

/**
 * Get method usage statistics
 */
export const getMethodUsageStats = async (): Promise<MethodStats[]> => {
  try {
    const { data, error } = await supabase
      .from('analysis_metadata')
      .select('method');

    if (error) throw error;

    // Подсчитываем использование каждого метода
    const methodCounts = new Map<PsychMethod, number>();
    const total = (data || []).length;

    (data || []).forEach(item => {
      const method = item.method as PsychMethod;
      methodCounts.set(method, (methodCounts.get(method) || 0) + 1);
    });

    // Преобразуем в массив с названиями и цветами из PSYCH_METHODS
    const result: MethodStats[] = Array.from(methodCounts.entries()).map(([method, count]) => {
      const methodInfo = PSYCH_METHODS.find(m => m.id === method);
      return {
        method,
        methodName: methodInfo?.name || method,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: methodInfo?.color || 'text-slate-400'
      };
    });

    // Сортируем по убыванию count
    return result.sort((a, b) => b.count - a.count);
  } catch (err) {
    console.error('Error in getMethodUsageStats:', err);
    return [];
  }
};

/**
 * Get API success rate statistics
 */
export const getAPISuccessRate = async (
  period: AnalyticsPeriod = 'month'
): Promise<APISuccessStats[]> => {
  try {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0);
    }

    const { data, error } = await supabase
      .from('usage_metrics')
      .select('created_at, success')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Группируем по дням
    const groupedByDay = new Map<string, { total: number; successful: number }>();

    (data || []).forEach(item => {
      const date = new Date(item.created_at);
      const dateKey = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!groupedByDay.has(dateKey)) {
        groupedByDay.set(dateKey, { total: 0, successful: 0 });
      }

      const stats = groupedByDay.get(dateKey)!;
      stats.total++;
      if (item.success) stats.successful++;
    });

    // Преобразуем в массив
    const result: APISuccessStats[] = Array.from(groupedByDay.entries()).map(([date, stats]) => ({
      date,
      total: stats.total,
      successful: stats.successful,
      failed: stats.total - stats.successful,
      successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
    }));

    return result;
  } catch (err) {
    console.error('Error in getAPISuccessRate:', err);
    return [];
  }
};

/**
 * Get average dream length statistics
 */
export const getAverageDreamLength = async (): Promise<DreamLengthStats> => {
  try {
    const { data, error } = await supabase
      .from('dream_entries')
      .select('dream_data');

    if (error) throw error;

    const lengths: number[] = [];

    (data || []).forEach(item => {
      try {
        const dreamData = typeof item.dream_data === 'string'
          ? JSON.parse(item.dream_data)
          : item.dream_data;

        if (dreamData?.description) {
          lengths.push(dreamData.description.length);
        }
      } catch (err) {
        console.error('Error parsing dream_data:', err);
      }
    });

    if (lengths.length === 0) {
      return { average: 0, median: 0, min: 0, max: 0, total: 0 };
    }

    const sorted = [...lengths].sort((a, b) => a - b);
    const average = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    return {
      average: Math.round(average),
      median,
      min,
      max,
      total: lengths.length
    };
  } catch (err) {
    console.error('Error in getAverageDreamLength:', err);
    return { average: 0, median: 0, min: 0, max: 0, total: 0 };
  }
};

/**
 * Get usage statistics by time of day (hourly)
 */
export const getUsageByTimeOfDay = async (): Promise<TimeOfDayStats[]> => {
  try {
    const { data, error } = await supabase
      .from('analysis_metadata')
      .select('created_at');

    if (error) throw error;

    // Группируем по часам
    const hourCounts = new Map<number, number>();

    // Инициализируем все часы нулями
    for (let i = 0; i < 24; i++) {
      hourCounts.set(i, 0);
    }

    (data || []).forEach(item => {
      const date = new Date(item.created_at);
      const hour = date.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    // Преобразуем в массив
    const result: TimeOfDayStats[] = Array.from(hourCounts.entries()).map(([hour, count]) => ({
      hour,
      hourLabel: `${hour.toString().padStart(2, '0')}:00`,
      count
    }));

    return result.sort((a, b) => a.hour - b.hour);
  } catch (err) {
    console.error('Error in getUsageByTimeOfDay:', err);
    return [];
  }
};

/**
 * Get usage statistics by day of week
 */
export const getUsageByDayOfWeek = async (): Promise<DayOfWeekStats[]> => {
  try {
    const { data, error } = await supabase
      .from('analysis_metadata')
      .select('created_at');

    if (error) throw error;

    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    // Группируем по дням недели
    const dayCounts = new Map<number, number>();

    // Инициализируем все дни нулями
    for (let i = 0; i < 7; i++) {
      dayCounts.set(i, 0);
    }

    (data || []).forEach(item => {
      const date = new Date(item.created_at);
      const day = date.getDay(); // 0-6 (воскресенье-суббота)
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    });

    // Преобразуем в массив, начиная с понедельника
    const result: DayOfWeekStats[] = [];

    // Сначала Пн-Сб (1-6)
    for (let i = 1; i < 7; i++) {
      result.push({
        day: i,
        dayName: dayNames[i],
        count: dayCounts.get(i) || 0
      });
    }

    // Затем воскресенье (0)
    result.push({
      day: 0,
      dayName: dayNames[0],
      count: dayCounts.get(0) || 0
    });

    return result;
  } catch (err) {
    console.error('Error in getUsageByDayOfWeek:', err);
    return [];
  }
};

// =====================================================
// AI PROVIDER MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Get all AI provider configurations
 */
export const getAllProviders = async (): Promise<AIProviderConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .order('provider_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error in getAllProviders:', err);
    throw err;
  }
};

/**
 * Get active AI provider configuration
 */
export const getActiveProvider = async (): Promise<AIProviderConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  } catch (err) {
    console.error('Error in getActiveProvider:', err);
    return null;
  }
};

/**
 * Get all models for a specific provider type
 */
export const getModelsForProvider = async (providerType: AIProviderType): Promise<AIModel[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('provider_type', providerType)
      .eq('is_available', true)
      .order('pricing->input', { ascending: true }); // Sort by price (cheapest first)

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error in getModelsForProvider:', err);
    throw err;
  }
};

/**
 * Get all available models (across all providers)
 */
export const getAllModels = async (): Promise<AIModel[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_available', true)
      .order('provider_type', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error in getAllModels:', err);
    throw err;
  }
};

/**
 * Get specific model by ID
 */
export const getModelById = async (modelId: string): Promise<AIModel | null> => {
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (err) {
    console.error('Error in getModelById:', err);
    return null;
  }
};

/**
 * Update AI provider configuration
 */
export const updateProviderConfig = async (
  providerId: string,
  updates: Partial<AIProviderConfig>
): Promise<void> => {
  try {
    // Ensure updated_at is set
    const { error } = await supabase
      .from('ai_provider_configs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', providerId);

    if (error) throw error;
  } catch (err) {
    console.error('Error in updateProviderConfig:', err);
    throw err;
  }
};

/**
 * Set active AI provider (deactivates all others)
 */
export const setActiveProvider = async (providerId: string): Promise<void> => {
  try {
    // 1. Deactivate all providers
    const { error: deactivateError } = await supabase
      .from('ai_provider_configs')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

    if (deactivateError) throw deactivateError;

    // 2. Activate selected provider
    const { error: activateError } = await supabase
      .from('ai_provider_configs')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', providerId);

    if (activateError) throw activateError;

    console.log(`Successfully activated provider: ${providerId}`);
  } catch (err) {
    console.error('Error in setActiveProvider:', err);
    throw err;
  }
};

/**
 * Test AI provider connection
 * Makes a minimal API call to verify configuration
 */
export const testProviderConnection = async (providerId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Import aiService dynamically to avoid circular dependencies
    const { aiService } = await import('./ai/aiService');

    // Temporarily activate this provider
    const originalActive = await getActiveProvider();

    // Set test provider as active
    await setActiveProvider(providerId);

    // Clear cache to force reload
    aiService.clearCache();

    // Test connection
    const result = await aiService.testConnection();

    // Restore original active provider
    if (originalActive) {
      await setActiveProvider(originalActive.id);
      aiService.clearCache();
    }

    return result;
  } catch (err: any) {
    console.error('Error in testProviderConnection:', err);
    return {
      success: false,
      message: err.message || 'Не удалось протестировать подключение'
    };
  }
};

/**
 * Add new AI model to database
 */
export const addModel = async (model: Omit<AIModel, 'id' | 'created_at'>): Promise<AIModel> => {
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .insert(model)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error in addModel:', err);
    throw err;
  }
};

/**
 * Update AI model configuration
 */
export const updateModel = async (modelId: string, updates: Partial<AIModel>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ai_models')
      .update(updates)
      .eq('id', modelId);

    if (error) throw error;
  } catch (err) {
    console.error('Error in updateModel:', err);
    throw err;
  }
};

/**
 * Delete AI model
 */
export const deleteModel = async (modelId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ai_models')
      .delete()
      .eq('id', modelId);

    if (error) throw error;
  } catch (err) {
    console.error('Error in deleteModel:', err);
    throw err;
  }
};

// =====================================================
// TASK-SPECIFIC AI PROVIDER FUNCTIONS (NEW)
// =====================================================

/**
 * Get active AI provider for a specific task type
 * @param taskType - 'text' for dream analysis or 'image' for visualization
 */
export const getActiveProviderForTask = async (taskType: AITaskType): Promise<AIProviderConfig | null> => {
  try {
    const field = taskType === 'text' ? 'is_active_for_text' : 'is_active_for_images';

    const { data, error } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .eq(field, true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  } catch (err) {
    console.error(`Error in getActiveProviderForTask(${taskType}):`, err);
    return null;
  }
};

/**
 * Set active AI provider for a specific task type
 * Deactivates all other providers for this task type
 * @param providerId - Provider UUID to activate
 * @param taskType - 'text' for dream analysis or 'image' for visualization
 */
export const setActiveProviderForTask = async (providerId: string, taskType: AITaskType): Promise<void> => {
  try {
    const field = taskType === 'text' ? 'is_active_for_text' : 'is_active_for_images';

    // 1. Deactivate all providers for this task type
    const { error: deactivateError } = await supabase
      .from('ai_provider_configs')
      .update({ [field]: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

    if (deactivateError) throw deactivateError;

    // 2. Activate selected provider for this task type
    const { error: activateError } = await supabase
      .from('ai_provider_configs')
      .update({
        [field]: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', providerId);

    if (activateError) throw activateError;

    console.log(`Successfully activated provider ${providerId} for task: ${taskType}`);
  } catch (err) {
    console.error(`Error in setActiveProviderForTask(${providerId}, ${taskType}):`, err);
    throw err;
  }
};

/**
 * Get models suitable for a specific task type
 * Filters models based on their capabilities (text vs image)
 * @param providerType - Provider type (e.g., 'gemini', 'openai')
 * @param taskType - 'text' for text-only models or 'image' for image-generation models
 */
export const getModelsForTask = async (
  providerType: AIProviderType,
  taskType: AITaskType
): Promise<AIModel[]> => {
  try {
    const capabilityField = taskType === 'image' ? 'capabilities->image' : 'capabilities->text';

    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('provider_type', providerType)
      .eq('is_available', true)
      .eq(capabilityField, true) // Filter by capability
      .order('pricing->input', { ascending: true }); // Sort by price (cheapest first)

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error(`Error in getModelsForTask(${providerType}, ${taskType}):`, err);
    throw err;
  }
};
