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
