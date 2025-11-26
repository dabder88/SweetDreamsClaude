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
-- DONE
-- =====================================================
-- After running this script, users will be able to
-- auto-promote themselves to admin when their email
-- is in the VITE_ADMIN_EMAILS environment variable.
-- =====================================================
