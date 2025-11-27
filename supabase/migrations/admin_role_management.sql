-- =====================================================
-- Admin Role Management System
-- =====================================================
-- This migration adds functions for admins to promote/demote other users
-- Includes security checks, audit logging, and protection against removing last admin

-- =====================================================
-- Drop existing functions if they exist (for idempotency)
-- =====================================================
DROP FUNCTION IF EXISTS promote_user_to_admin(UUID);
DROP FUNCTION IF EXISTS demote_admin_to_user(UUID);

-- =====================================================
-- Function: Promote User to Admin
-- =====================================================
-- Allows admins to grant admin rights to regular users
-- Security: SECURITY DEFINER runs with elevated privileges
-- Checks: Calling user must be admin, target must exist and not already be admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(target_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  calling_admin_id UUID;
  target_email TEXT;
BEGIN
  calling_admin_id := auth.uid();

  -- Check 1: Is the caller an admin?
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = calling_admin_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied: admin role required'
    );
  END IF;

  -- Check 2: Does the target user exist?
  SELECT email INTO target_email
  FROM auth.users
  WHERE id = target_user_id;

  IF target_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Check 3: Is the user already an admin?
  IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = target_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is already an admin'
    );
  END IF;

  -- Add to admin_users table
  INSERT INTO admin_users (user_id)
  VALUES (target_user_id);

  -- Log the action in audit_log
  INSERT INTO audit_log (
    admin_id,
    action_type,
    target_user_id,
    details
  )
  VALUES (
    calling_admin_id,
    'USER_ROLE_CHANGED',
    target_user_id,
    jsonb_build_object(
      'from', 'user',
      'to', 'admin',
      'target_email', target_email
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User successfully promoted to admin'
  );
END;
$$;

-- =====================================================
-- Function: Demote Admin to User
-- =====================================================
-- Allows admins to revoke admin rights from other admins
-- Security: Cannot remove the last admin (system would become unmanageable)
-- Checks: Calling user must be admin, target must be admin, not the last admin
CREATE OR REPLACE FUNCTION demote_admin_to_user(target_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  calling_admin_id UUID;
  admin_count INTEGER;
  target_email TEXT;
BEGIN
  calling_admin_id := auth.uid();

  -- Check 1: Is the caller an admin?
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = calling_admin_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied: admin role required'
    );
  END IF;

  -- Check 2: Is the target user an admin?
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = target_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not an admin'
    );
  END IF;

  -- Check 3: CRITICAL - Are we trying to remove the last admin?
  SELECT COUNT(*) INTO admin_count FROM admin_users;
  IF admin_count <= 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot remove the last admin. System must have at least one administrator.'
    );
  END IF;

  -- Get target user email for audit log
  SELECT email INTO target_email
  FROM auth.users
  WHERE id = target_user_id;

  -- Remove from admin_users table
  DELETE FROM admin_users WHERE user_id = target_user_id;

  -- Log the action in audit_log
  INSERT INTO audit_log (
    admin_id,
    action_type,
    target_user_id,
    details
  )
  VALUES (
    calling_admin_id,
    'USER_ROLE_CHANGED',
    target_user_id,
    jsonb_build_object(
      'from', 'admin',
      'to', 'user',
      'target_email', target_email
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin rights successfully revoked'
  );
END;
$$;

-- =====================================================
-- Grant Permissions
-- =====================================================
-- Allow authenticated users to call these functions
-- (They will still be checked for admin role inside the function)
GRANT EXECUTE ON FUNCTION promote_user_to_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION demote_admin_to_user(UUID) TO authenticated;

-- =====================================================
-- Comments for Documentation
-- =====================================================
COMMENT ON FUNCTION promote_user_to_admin(UUID) IS
  'Promotes a regular user to admin role. Requires caller to be an admin. Logs action to audit_log.';

COMMENT ON FUNCTION demote_admin_to_user(UUID) IS
  'Demotes an admin to regular user role. Requires caller to be an admin. Cannot remove last admin. Logs action to audit_log.';
