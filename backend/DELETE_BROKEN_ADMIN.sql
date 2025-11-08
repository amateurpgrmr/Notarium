-- Quick fix: Delete broken admin users with NULL or invalid class
-- Run this once, then admin login will work

-- Show current admins (before deletion)
SELECT 'BEFORE:' as status, id, email, class, role FROM users WHERE role = 'admin' OR email LIKE '%@notarium.site';

-- Delete them (will be recreated on next login with correct class)
DELETE FROM users WHERE role = 'admin' OR email LIKE '%@notarium.site';

-- Verify deletion
SELECT 'AFTER:' as status, COUNT(*) as admin_count FROM users WHERE role = 'admin' OR email LIKE '%@notarium.site';
