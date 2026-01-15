-- 1. ตรวจสอบจำนวน Tables (ควรได้ 17 tables)
SELECT 
    COUNT(*) as total_tables,
    CASE 
        WHEN COUNT(*) = 17 THEN '✅ ถูกต้อง'
        ELSE '❌ ไม่ถูกต้อง - ควรมี 17 tables'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
