-- =====================================================
-- Merge old audit logs from admin_audit_log to audit_log
-- =====================================================
-- This migration copies data from old table to new table

-- Check if admin_audit_log table exists and migrate data
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'admin_audit_log'
  ) THEN
    -- Copy all records from admin_audit_log to audit_log
    INSERT INTO audit_log (id, admin_id, action_type, target_user_id, details, created_at)
    SELECT id, admin_id, action_type, target_user_id, details, created_at
    FROM admin_audit_log
    ON CONFLICT (id) DO NOTHING;

    -- Drop old table after migration
    -- DROP TABLE IF EXISTS admin_audit_log;

    RAISE NOTICE 'Successfully migrated audit logs from admin_audit_log to audit_log';
  ELSE
    RAISE NOTICE 'Table admin_audit_log does not exist, no migration needed';
  END IF;
END $$;
