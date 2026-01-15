-- 6. ตรวจสอบข้อมูลเริ่มต้น - Tenants
SELECT 
    id,
    name,
    slug,
    subscription_plan,
    created_at
FROM tenants
ORDER BY created_at;
