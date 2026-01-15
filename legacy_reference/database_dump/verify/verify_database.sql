-- ============================================
-- RGA Dashboard Database Verification Script
-- ใช้สำหรับตรวจสอบว่าฐานข้อมูลถูกตั้งค่าถูกต้องหรือไม่
-- ============================================

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

-- 2. แสดงรายชื่อ Tables ทั้งหมด
SELECT 
    ROW_NUMBER() OVER (ORDER BY table_name) as no,
    table_name,
    CASE 
        WHEN table_name IN (
            'tenants', 'users', 'roles', 'integrations', 'campaigns', 
            'metrics', 'alerts', 'alert_history', 'reports', 'ai_insights',
            'ai_queries', 'audit_logs', 'sessions', 'sync_histories',
            'webhook_events', 'activity_logs', 'oauth_states'
        ) THEN '✅'
        ELSE '⚠️'
    END as expected
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. ตรวจสอบ Extensions
SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension
WHERE extname = 'uuid-ossp';

-- 4. ตรวจสอบจำนวน Indexes
SELECT 
    COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public';

-- 5. ตรวจสอบ Foreign Keys
SELECT 
    COUNT(*) as total_foreign_keys
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public';

-- 6. ตรวจสอบข้อมูลเริ่มต้น - Tenants
SELECT 
    id,
    name,
    slug,
    subscription_plan,
    created_at
FROM tenants
ORDER BY created_at;

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

-- 8. ตรวจสอบ Triggers
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 9. ตรวจสอบ Functions
SELECT 
    routine_name as function_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- 10. สรุปสถิติ Tables
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = schemaname AND table_name = tablename) as column_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 11. ตรวจสอบ Constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- 12. ตรวจสอบ Indexes ที่สำคัญ
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================
-- Quick Health Check
-- ============================================
SELECT 
    'Database Health Check' as check_type,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indexes_count,
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') as foreign_keys_count,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') as functions_count,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as triggers_count,
    (SELECT COUNT(*) FROM tenants) as tenants_count,
    (SELECT COUNT(*) FROM users) as users_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') = 17 
        THEN '✅ Healthy'
        ELSE '⚠️ Check Required'
    END as status;

