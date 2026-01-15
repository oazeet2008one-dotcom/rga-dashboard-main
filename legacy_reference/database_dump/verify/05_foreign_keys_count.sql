-- 5. ตรวจสอบ Foreign Keys
SELECT 
    COUNT(*) as total_foreign_keys
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public';
