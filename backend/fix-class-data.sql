-- Fix existing users with invalid class data
-- Run this in Cloudflare D1 console to fix bad data
-- NOTE: After applying migration 0001_allow_null_class.sql, admins can have NULL class

-- Set admin users to have NULL class
UPDATE users
SET class = NULL
WHERE role = 'admin' OR email LIKE '%@notarium.site';

-- Update student users with invalid class to '10.1'
UPDATE users
SET class = '10.1'
WHERE role = 'student' AND (class IS NULL OR class = '' OR class NOT IN ('10.1', '10.2', '10.3'));

-- Verify the fix
SELECT id, email, display_name, class, role
FROM users
ORDER BY role, id;
