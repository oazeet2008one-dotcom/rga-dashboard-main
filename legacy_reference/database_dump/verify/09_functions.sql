-- 9. ตรวจสอบ Functions
SELECT 
    routine_name as function_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';
