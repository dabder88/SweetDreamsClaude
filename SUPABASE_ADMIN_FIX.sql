-- =====================================================
-- Fix: Add INSERT policy for admin_users table
-- =====================================================
-- This fixes the "insufficient privilege" error (code 42501)
-- that prevents users from being auto-promoted to admin role.
--
-- Run this in Supabase SQL Editor to fix the issue.
-- =====================================================

-- Add INSERT policy for admin_users table
DROP POLICY IF EXISTS "Users can insert own admin record" ON admin_users;
CREATE POLICY "Users can insert own admin record"
  ON admin_users FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- Fix: Update user_balances RLS policies
-- =====================================================
-- Fix policies to allow proper access for both users and admins

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own balance" ON user_balances;
DROP POLICY IF EXISTS "Admins can view all balances" ON user_balances;
DROP POLICY IF EXISTS "Admins can manage balances" ON user_balances;

-- Create unified SELECT policy (users see own, admins see all)
CREATE POLICY "Users and admins can view balances"
  ON user_balances FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Create INSERT policy (system can create, admins can create for others)
CREATE POLICY "System and admins can create balances"
  ON user_balances FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Create UPDATE policy (users can update own, admins can update all)
CREATE POLICY "Users and admins can update balances"
  ON user_balances FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Create DELETE policy (only admins)
CREATE POLICY "Admins can delete balances"
  ON user_balances FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- =====================================================
-- DONE
-- =====================================================
-- After running this script:
-- 1. Users will be able to auto-promote to admin
-- 2. Users can view/update their own balances
-- 3. Admins can view/manage all user balances
-- =====================================================
