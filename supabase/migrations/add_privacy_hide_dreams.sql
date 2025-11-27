-- =====================================================
-- Add Privacy Setting for Admins
-- =====================================================
-- This migration adds privacy_hide_dreams field to user metadata
-- When enabled, hides dream history and analytics from other admins
-- Dream counts remain visible in user management table

-- Note: privacy_hide_dreams will be stored in raw_user_meta_data JSONB field
-- No schema change needed - just documentation for frontend implementation

-- =====================================================
-- Update get_all_users function to include privacy field
-- =====================================================
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
  -- raw_user_meta_data will contain privacy_hide_dreams field
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
