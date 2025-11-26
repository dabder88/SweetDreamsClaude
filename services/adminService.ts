import { supabase } from './supabaseClient';
import {
  User,
  AdminActionType,
  AuditLogEntry,
  UserBalance,
  Transaction,
  TransactionType,
  TransactionStatus,
  UsageMetric
} from '../types';

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
 */
export const getUserRole = async (userId: string): Promise<'user' | 'admin'> => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .single();

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
    let query = supabase
      .from('auth.users')
      .select(`
        id,
        email,
        created_at,
        raw_user_meta_data
      `);

    // Apply date filters
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply pagination
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    // Transform to User type
    const users: User[] = (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      name: u.raw_user_meta_data?.name,
      avatar_url: u.raw_user_meta_data?.avatar_url,
      gender: u.raw_user_meta_data?.gender,
      date_of_birth: u.raw_user_meta_data?.date_of_birth
    }));

    // Get admin roles for all users
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('user_id')
      .in('user_id', users.map(u => u.id));

    const adminIds = new Set((adminData || []).map((a: any) => a.user_id));

    // Add roles to users
    users.forEach(user => {
      user.role = adminIds.has(user.id) ? 'admin' : 'user';
    });

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
    // Get basic user info
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return null;
    }

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
 */
export const getUserBalance = async (userId: string): Promise<UserBalance | null> => {
  try {
    const { data, error } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching user balance:', error);
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
      .from('admin_audit_log')
      .insert({
        admin_id: user.id,
        action_type: actionType,
        target_user_id: details.target_user_id,
        details,
        ip_address: null // TODO: Get IP address if needed
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
      .from('admin_audit_log')
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

    return data as AuditLogEntry[] || [];
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
    // Get total users
    const { count: totalUsers } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    // Get new users in different periods
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { count: newUsers24h } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    const { count: newUsers7d } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    const { count: newUsers30d } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());

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
      totalUsers: totalUsers || 0,
      newUsers24h: newUsers24h || 0,
      newUsers7d: newUsers7d || 0,
      newUsers30d: newUsers30d || 0,
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
