-- =====================================================
-- PsyDream Admin Panel Database Setup
-- =====================================================
-- This file contains all table definitions and RLS policies
-- for the administrative panel functionality.
--
-- Run this script in Supabase SQL Editor after SUPABASE_SETUP.sql
-- =====================================================

-- =====================================================
-- 1. ADMIN USERS TABLE
-- =====================================================
-- Stores admin user roles and permissions
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'admin' CHECK (role = 'admin'), -- Single admin role level
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own admin record (simple, no recursion)
CREATE POLICY "Users can view own admin record"
  ON admin_users FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: Users can insert their own admin record (for auto-promotion)
CREATE POLICY "Users can insert own admin record"
  ON admin_users FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 2. ADMIN AUDIT LOG
-- =====================================================
-- Logs all administrative actions for security and compliance
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(user_id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policy: Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_log FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON admin_audit_log(action_type);

-- =====================================================
-- 3. AI PROVIDER CONFIGURATIONS
-- =====================================================
-- Stores AI provider configurations (for future multi-provider support)
CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_type TEXT NOT NULL, -- 'gemini', 'openai', 'anthropic', 'custom'
  config_name TEXT NOT NULL,
  api_key_encrypted TEXT, -- Store encrypted API keys
  model_name TEXT,
  parameters JSONB, -- temperature, max_tokens, etc.
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can manage provider configs
CREATE POLICY "Admins can manage provider configs"
  ON ai_provider_configs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- =====================================================
-- 4. USAGE METRICS
-- =====================================================
-- Tracks AI API usage for analytics and billing
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'dream_analysis', 'image_generation', 'archetype_analysis'
  provider_used TEXT,
  model_used TEXT,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all metrics
CREATE POLICY "Admins can view all metrics"
  ON usage_metrics FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policy: System can insert metrics
CREATE POLICY "System can insert metrics"
  ON usage_metrics FOR INSERT
  WITH CHECK (true); -- Allow inserts from application

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_id ON usage_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_created_at ON usage_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_action_type ON usage_metrics(action_type);

-- =====================================================
-- 5. USER BALANCES
-- =====================================================
-- Tracks user account balances for monetization
CREATE TABLE IF NOT EXISTS user_balances (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  balance DECIMAL(10, 2) DEFAULT 0.00, -- Balance in RUB or tokens
  currency TEXT DEFAULT 'RUB', -- RUB, USD, TOKENS, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users and admins can view balances (users see own, admins see all)
CREATE POLICY "Users and admins can view balances"
  ON user_balances FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policy: System and admins can create balances
CREATE POLICY "System and admins can create balances"
  ON user_balances FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policy: Users and admins can update balances
CREATE POLICY "Users and admins can update balances"
  ON user_balances FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policy: Only admins can delete balances
CREATE POLICY "Admins can delete balances"
  ON user_balances FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- =====================================================
-- 6. TRANSACTIONS
-- =====================================================
-- Records all financial transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'manual_credit', 'manual_debit', 'refund')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2),
  balance_after DECIMAL(10, 2),
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'pending', 'failed', 'cancelled')),
  description TEXT,
  admin_id UUID REFERENCES admin_users(user_id) ON DELETE SET NULL, -- NULL if not manual operation
  metadata JSONB, -- Additional data (payment system ID, purchase details, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policy: Admins can create transactions
CREATE POLICY "Admins can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_admin_id ON transactions(admin_id) WHERE admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- =====================================================
-- 7. SUBSCRIPTION PLANS
-- =====================================================
-- Defines available subscription plans (for future use)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'RUB',
  duration_days INTEGER, -- NULL for one-time purchases
  features JSONB, -- {"dream_analyses": 100, "image_generations": 50}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view active plans
CREATE POLICY "Everyone can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- RLS Policy: Admins can manage plans
CREATE POLICY "Admins can manage plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- =====================================================
-- 8. USER SUBSCRIPTIONS
-- =====================================================
-- Tracks user subscriptions (for future use)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policy: Admins can manage subscriptions
CREATE POLICY "Admins can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);

-- =====================================================
-- 9. SYSTEM SETTINGS
-- =====================================================
-- Stores system-wide configuration settings
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(user_id)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage settings
CREATE POLICY "Admins can manage settings"
  ON system_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- =====================================================
-- UPDATE EXISTING TABLES RLS POLICIES
-- =====================================================

-- Drop and recreate dream_entries policy to allow admin access
DROP POLICY IF EXISTS "Users can view own dreams" ON dream_entries;
CREATE POLICY "Users can view own dreams"
  ON dream_entries FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Drop and recreate analysis_metadata policy to allow admin access
DROP POLICY IF EXISTS "Users can view own metadata" ON analysis_metadata;
CREATE POLICY "Users can view own metadata"
  ON analysis_metadata FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_ai_provider_configs_updated_at
  BEFORE UPDATE ON ai_provider_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_balances_updated_at
  BEFORE UPDATE ON user_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RPC FUNCTIONS FOR ADMIN USER MANAGEMENT
-- =====================================================
-- These functions allow admins to safely access auth.users data

-- Function to get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  raw_user_meta_data JSONB,
  last_sign_in_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Return all users from auth.users
  RETURN QUERY
  SELECT
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data,
    au.last_sign_in_at,
    au.email_confirmed_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;

-- Function to get user by ID (admin only)
CREATE OR REPLACE FUNCTION get_user_by_id(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  raw_user_meta_data JSONB,
  last_sign_in_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Return specific user
  RETURN QUERY
  SELECT
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data,
    au.last_sign_in_at,
    au.email_confirmed_at
  FROM auth.users au
  WHERE au.id = target_user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_id(UUID) TO authenticated;

-- =====================================================
-- INITIAL DATA (OPTIONAL)
-- =====================================================

-- Insert default system settings
INSERT INTO system_settings (key, value) VALUES
  ('daily_analysis_limit', '{"free": 5, "paid": -1}'),
  ('max_dream_description_length', '10000'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- All admin panel tables and policies have been created.
-- Next steps:
-- 1. Add admin user emails to VITE_ADMIN_EMAILS environment variable
-- 2. Deploy updated application code with admin panel UI
-- 3. First admin will be auto-promoted on login
-- =====================================================
