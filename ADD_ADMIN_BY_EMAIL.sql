-- =====================================================
-- ADD USER AS ADMIN BY EMAIL
-- =====================================================
-- This script adds a specific user to admin_users table by email
-- ВАЖНО: Замените 'brainpinky@bk.ru' на нужный email если требуется
-- =====================================================

-- Step 1: Check if user exists
SELECT
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'brainpinky@bk.ru';

-- Step 2: Add user to admin_users by email
INSERT INTO admin_users (user_id, role)
SELECT
  id,
  'admin'
FROM auth.users
WHERE email = 'brainpinky@bk.ru'
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Verify user is now admin
SELECT
  au.user_id,
  au.role,
  au.created_at,
  u.email
FROM admin_users au
LEFT JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'brainpinky@bk.ru';

-- Step 4: Show all admins
SELECT
  au.user_id,
  au.role,
  au.created_at,
  u.email
FROM admin_users au
LEFT JOIN auth.users u ON u.id = au.user_id
ORDER BY au.created_at DESC;

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- Step 1: Should show 1 row with user ID and email 'brainpinky@bk.ru'
-- Step 2: Should complete without errors (1 row inserted or 0 if already exists)
-- Step 3: Should show 1 row with role='admin' for brainpinky@bk.ru
-- Step 4: Should show all admins (including brainpinky@bk.ru)
-- =====================================================
