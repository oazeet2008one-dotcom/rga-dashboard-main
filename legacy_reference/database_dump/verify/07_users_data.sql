-- 7. ตรวจสอบข้อมูลเริ่มต้น - Users
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    email_verified
FROM users
ORDER BY created_at;
