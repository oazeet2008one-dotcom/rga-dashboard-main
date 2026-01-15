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
