-- =====================================================
-- CHECK ADMIN STATUS AND DATA ACCESS
-- =====================================================
-- This script helps debug admin access issues
-- Run this in Supabase SQL Editor while logged in as admin
-- =====================================================

-- Check 1: View current user
SELECT
  auth.uid() AS "Current User ID",
  auth.email() AS "Current Email";

-- Check 2: Check if current user is in admin_users table
SELECT
  au.user_id,
  au.role,
  au.created_at,
  u.email
FROM admin_users au
LEFT JOIN auth.users u ON u.id = au.user_id
WHERE au.user_id = auth.uid();

-- Check 3: View all admins
SELECT
  au.user_id,
  au.role,
  au.created_at,
  u.email
FROM admin_users au
LEFT JOIN auth.users u ON u.id = au.user_id;

-- Check 4: Check RLS policies on user_balances
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_balances'
ORDER BY cmd, policyname;

-- Check 5: Try to select user_balances
SELECT
  user_id,
  balance,
  currency
FROM user_balances
LIMIT 5;

-- Check 6: Test admin check function
SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) AS "Is Admin";

-- =====================================================
-- INTERPRETATION:
-- =====================================================
-- Check 1: Should show your current user ID and email
-- Check 2: Should return 1 row if you are admin (empty = not admin!)
-- Check 3: Shows all admins in the system
-- Check 4: Shows all RLS policies (should see 4 policies)
-- Check 5: Should return balances if you're admin (error = RLS issue)
-- Check 6: Should return true if you're admin
-- =====================================================
