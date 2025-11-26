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

-- Drop existing policies (including new ones if they exist)
DROP POLICY IF EXISTS "Users can view own balance" ON user_balances;
DROP POLICY IF EXISTS "Admins can view all balances" ON user_balances;
DROP POLICY IF EXISTS "Admins can manage balances" ON user_balances;
DROP POLICY IF EXISTS "Users and admins can view balances" ON user_balances;
DROP POLICY IF EXISTS "System and admins can create balances" ON user_balances;
DROP POLICY IF EXISTS "Users and admins can update balances" ON user_balances;
DROP POLICY IF EXISTS "Admins can delete balances" ON user_balances;

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
-- Fix: Add RPC functions for admin user management
-- =====================================================
-- These functions allow admins to access auth.users data safely

-- Function to get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
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
  email VARCHAR(255),
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

-- Grant execute permissions to authenticated users (RLS will check admin status)
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_id(UUID) TO authenticated;

-- =====================================================
-- DONE
-- =====================================================
-- After running this script:
-- 1. Users will be able to auto-promote to admin
-- 2. Users can view/update their own balances
-- 3. Admins can view/manage all user balances
-- 4. Admins can access user data via RPC functions
-- =====================================================
