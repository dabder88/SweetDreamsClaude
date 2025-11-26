
export enum PsychMethod {
  AUTO = 'auto',
  JUNGIAN = 'jungian',
  FREUDIAN = 'freudian',
  GESTALT = 'gestalt',
  COGNITIVE = 'cognitive', // CBT oriented
  EXISTENTIAL = 'existential'
}

export interface DreamContext {
  emotion: string;
  lifeSituation: string;
  associations: string;
  recurring: boolean;
  dayResidue: string;
  characterType: string;
  dreamRole: string;
  physicalSensation: string;
}

export interface DreamData {
  description: string;
  context: DreamContext;
  method: PsychMethod;
}

export interface DreamSymbol {
  name: string;
  meaning: string;
}

export interface AnalysisResponse {
  summary: string;
  symbolism: DreamSymbol[];
  analysis: string; // Deep dive text
  advice: string[]; // Array of strings for distinct advice blocks
  questions: string[];
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  name?: string; // Display name
  avatar_url?: string; // Avatar image URL from Supabase Storage
  gender?: 'male' | 'female'; // User's gender
  date_of_birth?: string; // ISO date string (YYYY-MM-DD)
  role?: 'user' | 'admin'; // User role for access control
  balance?: number; // Current balance (for monetization)
}

export interface JournalEntry {
  id: string;
  user_id?: string; // Optional for backward compatibility with localStorage
  timestamp: number;
  dreamData: DreamData;
  analysis: AnalysisResponse | string; // Support legacy string or new structured object
  imageUrl?: string | null;
  notes?: string;
}

/**
 * Lightweight metadata for dream analysis statistics
 * Stored in Supabase for all analyses (even unsaved ones)
 * Used for cross-device statistics synchronization
 */
export interface AnalysisMetadata {
  id: string;
  user_id: string;
  timestamp: number;
  method: PsychMethod;
  emotion: string;
  recurring: boolean;
  symbols: string[]; // Array of symbol names for frequency tracking
  dream_description?: string; // Brief description of the dream for archetype analysis
  life_situation?: string; // Life context for better analysis
  created_at?: string;
}

export type AppView = 'wizard' | 'landing' | 'dashboard' | 'journal' | 'dreamView' | 'analytics' | 'archetypes' | 'settings' | 'auth' | 'admin';

// =====================================================
// ADMIN PANEL TYPES
// =====================================================

export enum AdminActionType {
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  BALANCE_CREDITED = 'BALANCE_CREDITED',
  BALANCE_DEBITED = 'BALANCE_DEBITED',
  PROVIDER_CHANGED = 'PROVIDER_CHANGED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT'
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action_type: AdminActionType;
  target_user_id?: string;
  details: any;
  ip_address?: string;
  created_at: string;
}

export interface AIProviderConfig {
  id: string;
  provider_type: 'gemini' | 'openai' | 'anthropic' | 'custom';
  config_name: string;
  api_key_encrypted?: string;
  model_name: string;
  parameters: {
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageMetric {
  id: string;
  user_id?: string;
  action_type: 'dream_analysis' | 'image_generation' | 'archetype_analysis';
  provider_used: string;
  model_used: string;
  tokens_used?: number;
  response_time_ms: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface UserBalance {
  user_id: string;
  balance: number;
  currency: string; // 'RUB', 'USD', 'TOKENS'
  created_at: string;
  updated_at: string;
}

export enum TransactionType {
  DEPOSIT = 'deposit',           // Automatic deposit
  WITHDRAWAL = 'withdrawal',     // Withdrawal
  PURCHASE = 'purchase',         // Purchase (analysis, image)
  MANUAL_CREDIT = 'manual_credit', // Manual credit by admin
  MANUAL_DEBIT = 'manual_debit',   // Manual debit by admin
  ADMIN_CREDIT = 'admin_credit', // Admin credit (alias for MANUAL_CREDIT)
  ADMIN_DEBIT = 'admin_debit',   // Admin debit (alias for MANUAL_DEBIT)
  DREAM_ANALYSIS = 'dream_analysis', // Dream analysis purchase
  IMAGE_GENERATION = 'image_generation', // Image generation purchase
  REFUND = 'refund'              // Refund
}

export enum TransactionStatus {
  SUCCESS = 'success',
  PENDING = 'pending',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  status: TransactionStatus;
  description?: string;
  admin_id?: string; // Admin ID for manual operations
  metadata?: any;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration_days?: number; // null for one-time
  features: {
    dream_analyses?: number;
    image_generations?: number;
    [key: string]: any;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at?: string;
  auto_renew: boolean;
  created_at: string;
}
