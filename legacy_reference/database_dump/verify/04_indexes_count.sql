-- 4. ตรวจสอบจำนวน Indexes
SELECT 
    COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public';
