-- =====================================================
-- VERIFY AND FIX RLS POLICIES FOR user_balances
-- =====================================================
-- This script verifies and fixes RLS policies for admin access
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Check current policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_balances'
ORDER BY policyname;

-- Step 2: Drop ALL existing policies on user_balances
DROP POLICY IF EXISTS "Users can view own balance" ON user_balances;
DROP POLICY IF EXISTS "Admins can view all balances" ON user_balances;
DROP POLICY IF EXISTS "Admins can manage balances" ON user_balances;
DROP POLICY IF EXISTS "Users and admins can view balances" ON user_balances;
DROP POLICY IF EXISTS "System and admins can create balances" ON user_balances;
DROP POLICY IF EXISTS "Users and admins can update balances" ON user_balances;
DROP POLICY IF EXISTS "Admins can delete balances" ON user_balances;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_balances;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_balances;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_balances;

-- Step 3: Create new unified policies with proper admin checks

-- SELECT: Users see own balance, admins see all
CREATE POLICY "Users and admins can view balances"
  ON user_balances FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- INSERT: Users can create own balance, admins can create for anyone
CREATE POLICY "System and admins can create balances"
  ON user_balances FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- UPDATE: Users can update own, admins can update all
CREATE POLICY "Users and admins can update balances"
  ON user_balances FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- DELETE: Only admins
CREATE POLICY "Admins can delete balances"
  ON user_balances FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Step 4: Verify new policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_balances'
ORDER BY policyname;

-- =====================================================
-- DONE
-- =====================================================
-- After running this script:
-- 1. All old policies will be removed
-- 2. New policies will allow admins to access all balances
-- 3. Users can still access their own balances
-- =====================================================
