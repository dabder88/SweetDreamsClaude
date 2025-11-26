-- =====================================================
-- AUTO-CREATE USER BALANCE ON REGISTRATION
-- =====================================================
-- This trigger automatically creates a user_balances record
-- when a new user registers in auth.users
-- =====================================================

-- Step 1: Create function to auto-create balance
CREATE OR REPLACE FUNCTION public.create_user_balance()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert balance record for new user
  INSERT INTO public.user_balances (user_id, balance, currency)
  VALUES (NEW.id, 0, 'RUB')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Step 2: Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_balance();

-- Step 3: Create balances for existing users (one-time)
INSERT INTO user_balances (user_id, balance, currency)
SELECT
  id,
  0,
  'RUB'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_balances)
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Verify
SELECT
  (SELECT COUNT(*) FROM auth.users) as "Total Users",
  (SELECT COUNT(*) FROM user_balances) as "Total Balances",
  (SELECT COUNT(*) FROM auth.users WHERE id NOT IN (SELECT user_id FROM user_balances)) as "Users Without Balance";

-- =====================================================
-- DONE
-- =====================================================
-- After running this script:
-- 1. All existing users will have balances
-- 2. New users will automatically get balance on registration
-- 3. No more 406 errors!
-- =====================================================
