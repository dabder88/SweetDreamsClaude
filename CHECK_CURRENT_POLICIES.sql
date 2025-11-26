-- =====================================================
-- CHECK CURRENT RLS POLICIES
-- =====================================================

-- Check RLS policies on user_balances
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_balances'
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'user_balances';

-- Count policies
SELECT COUNT(*) as "Total Policies on user_balances"
FROM pg_policies
WHERE tablename = 'user_balances';
