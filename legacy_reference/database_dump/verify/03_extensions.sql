-- 3. ตรวจสอบ Extensions
SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension
WHERE extname = 'uuid-ossp';
