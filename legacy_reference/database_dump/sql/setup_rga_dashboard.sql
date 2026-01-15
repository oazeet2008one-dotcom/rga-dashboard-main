-- ============================================
-- RGA Dashboard Database Setup Script
-- สำหรับ pgAdmin4
-- Database Name: rga_dashboard
-- ============================================

-- สร้าง Database (ถ้ายังไม่มี)
-- หมายเหตุ: ต้องสร้าง database ก่อนใน pgAdmin4
-- CREATE DATABASE rga_dashboard;

-- เชื่อมต่อกับ database rga_dashboard ก่อนรันสคริปต์นี้

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TENANTS (Multi-tenant Architecture)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    logo_url TEXT,
    
    -- Branding
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#10B981',
    
    -- Settings
    timezone VARCHAR(50) DEFAULT 'Asia/Bangkok',
    currency VARCHAR(3) DEFAULT 'THB',
    language VARCHAR(5) DEFAULT 'th',
    
    -- Subscription
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(20) DEFAULT 'active',
    subscription_ends_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    
    role VARCHAR(50) DEFAULT 'user', -- super_admin, admin, user
    admin_type VARCHAR(50), -- admin_a, admin_b (for admin role)
    
    -- Security
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================
-- ROLES & PERMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, name)
);

-- ============================================
-- DATA SOURCES & INTEGRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- google_ads, facebook_ads, ga4, tiktok, shopee, lazada
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    
    -- Credentials (encrypted)
    credentials JSONB NOT NULL,
    
    -- Config
    config JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, error
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    sync_frequency_minutes INTEGER DEFAULT 15,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_is_active ON integrations(is_active);

-- ============================================
-- CAMPAIGNS
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    external_id VARCHAR(255), -- ID from external platform
    name VARCHAR(255) NOT NULL,
    
    -- Campaign Details
    platform VARCHAR(50) NOT NULL, -- google, facebook, tiktok, etc.
    campaign_type VARCHAR(50), -- search, display, shopping, video
    objective VARCHAR(50), -- awareness, consideration, conversion
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, paused, ended
    
    -- Budget
    budget DECIMAL(15, 2),
    budget_type VARCHAR(20), -- daily, lifetime
    currency VARCHAR(3) DEFAULT 'THB',
    
    -- Dates
    start_date DATE,
    end_date DATE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, platform, external_id)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- ============================================
-- METRICS (Time-series data)
-- ============================================
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Time
    date DATE NOT NULL,
    hour INTEGER CHECK (hour >= 0 AND hour <= 23),
    
    -- Source
    platform VARCHAR(50) NOT NULL,
    source VARCHAR(100), -- campaign, adset, ad, keyword, etc.
    
    -- Advertising Metrics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    -- Costs
    spend DECIMAL(15, 2) DEFAULT 0,
    cost_per_click DECIMAL(10, 4),
    cost_per_mille DECIMAL(10, 4),
    cost_per_action DECIMAL(10, 4),
    
    -- Performance
    ctr DECIMAL(8, 4), -- Click-through rate
    conversion_rate DECIMAL(8, 4),
    roas DECIMAL(10, 4), -- Return on ad spend
    
    -- Revenue
    revenue DECIMAL(15, 2) DEFAULT 0,
    orders INTEGER DEFAULT 0,
    
    -- E-commerce
    cart_abandonment_rate DECIMAL(8, 4),
    average_order_value DECIMAL(10, 2),
    
    -- SEO
    organic_traffic INTEGER,
    bounce_rate DECIMAL(8, 4),
    avg_session_duration INTEGER, -- seconds
    
    -- Additional data
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, campaign_id, date, hour, platform, source)
);

CREATE INDEX IF NOT EXISTS idx_metrics_tenant_date ON metrics(tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_campaign_date ON metrics(campaign_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_platform ON metrics(platform);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics(date DESC);

-- ============================================
-- ALERTS & NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Alert Type
    alert_type VARCHAR(50) NOT NULL, -- threshold, anomaly, budget
    
    -- Conditions
    metric VARCHAR(50) NOT NULL, -- ctr, cpc, conversions, spend, etc.
    operator VARCHAR(10) NOT NULL, -- gt, lt, eq, gte, lte
    threshold DECIMAL(15, 4),
    
    -- Notification
    notification_channels JSONB DEFAULT '["email"]', -- email, sms, webhook
    recipients JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP,
    trigger_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_tenant ON alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active);

-- ============================================
-- ALERT HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metric_value DECIMAL(15, 4),
    threshold_value DECIMAL(15, 4),
    
    message TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Notification Status
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_history_alert ON alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered ON alert_history(triggered_at DESC);

-- ============================================
-- REPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Report Config
    report_type VARCHAR(50) NOT NULL, -- campaign, platform, custom
    date_range_type VARCHAR(20), -- today, yesterday, last_7_days, last_30_days, custom
    start_date DATE,
    end_date DATE,
    
    -- Filters
    filters JSONB DEFAULT '{}',
    
    -- Metrics to include
    metrics JSONB DEFAULT '[]',
    
    -- Schedule
    is_scheduled BOOLEAN DEFAULT false,
    schedule_frequency VARCHAR(20), -- daily, weekly, monthly
    schedule_time TIME,
    schedule_day_of_week INTEGER,
    schedule_day_of_month INTEGER,
    
    -- Export
    export_format VARCHAR(10) DEFAULT 'pdf', -- pdf, csv, excel
    
    -- File
    file_url TEXT,
    file_size INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_tenant ON reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);

-- ============================================
-- AI INSIGHTS
-- ============================================
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Insight Type
    insight_type VARCHAR(50) NOT NULL, -- trend, anomaly, recommendation, prediction
    
    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Analysis
    analysis JSONB DEFAULT '{}',
    
    -- Recommendation
    recommended_action TEXT,
    expected_impact TEXT,
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    
    -- Status
    status VARCHAR(20) DEFAULT 'new', -- new, viewed, dismissed, actioned
    viewed_at TIMESTAMP,
    actioned_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_tenant ON ai_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_campaign ON ai_insights(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_insight_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_priority ON ai_insights(priority);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created ON ai_insights(created_at DESC);

-- ============================================
-- AI QUERIES (Natural Language)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Query
    query TEXT NOT NULL,
    language VARCHAR(5) DEFAULT 'th',
    
    -- Response
    response TEXT,
    sql_generated TEXT,
    
    -- Metadata
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_queries_tenant ON ai_queries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_queries_user ON ai_queries(user_id);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action
    action VARCHAR(50) NOT NULL, -- login, logout, create, update, delete, export
    entity_type VARCHAR(50), -- campaign, user, report, etc.
    entity_id UUID,
    
    -- Details
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- SESSIONS (for real-time tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    token VARCHAR(500) NOT NULL UNIQUE,
    
    ip_address TEXT,
    user_agent TEXT,
    
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- SYNC HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS sync_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'success', -- success, error, partial
    data JSONB,
    error TEXT,
    
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_histories_tenant ON sync_histories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_histories_integration ON sync_histories(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_histories_platform ON sync_histories(platform);
CREATE INDEX IF NOT EXISTS idx_sync_histories_synced ON sync_histories(synced_at DESC);

-- ============================================
-- WEBHOOK EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    platform VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    signature VARCHAR(500),
    
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant ON webhook_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_platform ON webhook_events(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON webhook_events(received_at);

-- ============================================
-- ACTIVITY LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    ip_address VARCHAR(45),
    user_agent TEXT,
    platform VARCHAR(50),
    status VARCHAR(20) DEFAULT 'success', -- success, error
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_platform ON activity_logs(platform);
CREATE INDEX IF NOT EXISTS idx_activity_logs_status ON activity_logs(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- ============================================
-- OAUTH STATES
-- ============================================
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    state VARCHAR(255) UNIQUE NOT NULL,
    redirect_uri TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_integration ON oauth_states(integration_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_metrics_updated_at ON metrics;
CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA (Production Ready)
-- ============================================
-- หมายเหตุ: สำหรับการใช้งานจริง ไม่มี seed data
-- ให้สร้าง tenant และ user ผ่าน API หรือ admin panel
-- 
-- ตัวอย่างการสร้าง tenant และ user แรก:
-- 1. สร้าง tenant ผ่าน API: POST /api/v1/tenants
-- 2. สร้าง super admin ผ่าน API: POST /api/v1/users
-- 
-- หรือใช้ script create_admin_user.sql สำหรับสร้าง admin user แรก

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE tenants IS 'Multi-tenant organizations/clients';
COMMENT ON TABLE users IS 'User accounts with role-based access';
COMMENT ON TABLE campaigns IS 'Marketing campaigns from various platforms';
COMMENT ON TABLE metrics IS 'Time-series performance metrics';
COMMENT ON TABLE alerts IS 'Alert configurations for monitoring';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations';
COMMENT ON TABLE integrations IS 'External platform integrations and credentials';
COMMENT ON TABLE sync_histories IS 'History of data synchronization operations';
COMMENT ON TABLE webhook_events IS 'Incoming webhook events from external platforms';
COMMENT ON TABLE activity_logs IS 'User activity and action history';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- ตรวจสอบ tables ทั้งหมด
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- ตรวจสอบว่ายังไม่มี seed data (สำหรับ production)
-- SELECT COUNT(*) as tenant_count FROM tenants;  -- ควรได้ 0
-- SELECT COUNT(*) as user_count FROM users;      -- ควรได้ 0

-- ตรวจสอบจำนวน tables (ควรได้ 17)
-- SELECT COUNT(*) as total_tables
-- FROM information_schema.tables 
-- WHERE table_schema = 'public';

-- ============================================
-- NEXT STEPS
-- ============================================
-- 1. สร้าง Tenant แรกผ่าน API: POST /api/v1/tenants
-- 2. สร้าง Super Admin User ผ่าน API: POST /api/v1/users
-- 3. ดูคู่มือ: database/PRODUCTION_SETUP.md

-- ============================================
-- END OF SCRIPT
-- ============================================

