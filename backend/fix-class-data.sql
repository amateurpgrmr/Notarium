-- Fix existing users with invalid class data
-- Run this in Cloudflare D1 console to fix bad data

-- Update all users with NULL or empty class to '10.1'
UPDATE users
SET class = '10.1'
WHERE class IS NULL OR class = '' OR class NOT IN ('10.1', '10.2', '10.3');

-- Verify the fix
SELECT id, email, display_name, class, role
FROM users
WHERE role = 'admin' OR email LIKE '%@notarium.site';
