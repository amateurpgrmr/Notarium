-- Quick fix: Update broken admin users with NULL or invalid class
-- Run this once, then admin login will work

-- Show current admins (before update)
SELECT 'BEFORE:' as status, id, email, class, role FROM users WHERE role = 'admin' OR email LIKE '%@notarium.site';

-- Fix admins by setting their class to a valid value (10.1)
UPDATE users
SET class = '10.1', updated_at = datetime('now')
WHERE (role = 'admin' OR email LIKE '%@notarium.site')
  AND (class IS NULL OR class NOT IN ('10.1', '10.2', '10.3'));

-- Verify update
SELECT 'AFTER:' as status, id, email, class, role FROM users WHERE role = 'admin' OR email LIKE '%@notarium.site';
