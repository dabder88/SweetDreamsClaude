-- =====================================================
-- ADD CURRENT USER AS ADMIN
-- =====================================================
-- This script adds the currently logged-in user to admin_users table
-- Run this in Supabase SQL Editor while logged in
-- =====================================================

-- Step 1: Check current user
SELECT
  auth.uid() AS "Your User ID",
  auth.email() AS "Your Email";

-- Step 2: Add current user to admin_users
INSERT INTO admin_users (user_id, role)
VALUES (auth.uid(), 'admin')
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Verify you're now admin
SELECT
  au.user_id,
  au.role,
  au.created_at,
  u.email
FROM admin_users au
LEFT JOIN auth.users u ON u.id = au.user_id
WHERE au.user_id = auth.uid();

-- Step 4: Test admin check
SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) AS "Is Admin Now";

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- Step 1: Should show your user ID and email
-- Step 2: Should complete without errors
-- Step 3: Should show 1 row with your data and role='admin'
-- Step 4: Should return TRUE
-- =====================================================
