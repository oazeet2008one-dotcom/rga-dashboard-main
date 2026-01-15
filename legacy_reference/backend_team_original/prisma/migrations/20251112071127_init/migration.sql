-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "domain" VARCHAR(255),
    "logo_url" TEXT,
    "primary_color" VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    "secondary_color" VARCHAR(7) NOT NULL DEFAULT '#10B981',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Bangkok',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'THB',
    "language" VARCHAR(5) NOT NULL DEFAULT 'th',
    "subscription_plan" VARCHAR(50) NOT NULL DEFAULT 'basic',
    "subscription_status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "subscription_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "phone" VARCHAR(20),
    "avatar_url" TEXT,
    "role" VARCHAR(50) NOT NULL DEFAULT 'viewer',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "credentials" JSONB NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "last_sync_at" TIMESTAMP(3),
    "sync_frequency_minutes" INTEGER NOT NULL DEFAULT 15,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "integration_id" UUID,
    "external_id" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "campaign_type" VARCHAR(50),
    "objective" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "budget" DECIMAL(15,2),
    "budget_type" VARCHAR(20),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'THB',
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "campaign_id" UUID,
    "date" DATE NOT NULL,
    "hour" INTEGER,
    "platform" VARCHAR(50) NOT NULL,
    "source" VARCHAR(100),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend" DECIMAL(15,2),
    "cost_per_click" DECIMAL(10,4),
    "cost_per_mille" DECIMAL(10,4),
    "cost_per_action" DECIMAL(10,4),
    "ctr" DECIMAL(8,4),
    "conversion_rate" DECIMAL(8,4),
    "roas" DECIMAL(10,4),
    "revenue" DECIMAL(15,2),
    "orders" INTEGER,
    "cart_abandonment_rate" DECIMAL(8,4),
    "average_order_value" DECIMAL(10,2),
    "organic_traffic" INTEGER,
    "bounce_rate" DECIMAL(8,4),
    "avg_session_duration" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "campaign_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "alert_type" VARCHAR(50) NOT NULL,
    "metric" VARCHAR(50) NOT NULL,
    "operator" VARCHAR(10) NOT NULL,
    "threshold" DECIMAL(15,4),
    "notification_channels" JSONB NOT NULL DEFAULT '["email"]',
    "recipients" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered_at" TIMESTAMP(3),
    "trigger_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_history" (
    "id" UUID NOT NULL,
    "alert_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metric_value" DECIMAL(15,4),
    "threshold_value" DECIMAL(15,4),
    "message" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "notification_sent" BOOLEAN NOT NULL DEFAULT false,
    "notification_sent_at" TIMESTAMP(3),

    CONSTRAINT "alert_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_by" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "report_type" VARCHAR(50) NOT NULL,
    "date_range_type" VARCHAR(20),
    "start_date" DATE,
    "end_date" DATE,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "metrics" JSONB NOT NULL DEFAULT '[]',
    "is_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "schedule_frequency" VARCHAR(20),
    "schedule_time" TIME(6),
    "schedule_day_of_week" INTEGER,
    "schedule_day_of_month" INTEGER,
    "export_format" VARCHAR(10) NOT NULL DEFAULT 'pdf',
    "file_url" TEXT,
    "file_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "campaign_id" UUID,
    "insight_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "analysis" JSONB NOT NULL DEFAULT '{}',
    "recommended_action" TEXT,
    "expected_impact" TEXT,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "viewed_at" TIMESTAMP(3),
    "actioned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_queries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "query" TEXT NOT NULL,
    "language" VARCHAR(5) NOT NULL DEFAULT 'th',
    "response" TEXT,
    "sql_generated" TEXT,
    "processing_time_ms" INTEGER,
    "tokens_used" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_name_key" ON "roles"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "integrations_tenant_id_idx" ON "integrations"("tenant_id");

-- CreateIndex
CREATE INDEX "integrations_type_idx" ON "integrations"("type");

-- CreateIndex
CREATE INDEX "campaigns_tenant_id_idx" ON "campaigns"("tenant_id");

-- CreateIndex
CREATE INDEX "campaigns_platform_idx" ON "campaigns"("platform");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_tenant_id_platform_external_id_key" ON "campaigns"("tenant_id", "platform", "external_id");

-- CreateIndex
CREATE INDEX "metrics_tenant_id_date_idx" ON "metrics"("tenant_id", "date" DESC);

-- CreateIndex
CREATE INDEX "metrics_campaign_id_date_idx" ON "metrics"("campaign_id", "date" DESC);

-- CreateIndex
CREATE INDEX "metrics_platform_idx" ON "metrics"("platform");

-- CreateIndex
CREATE INDEX "metrics_date_idx" ON "metrics"("date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "metrics_tenant_id_campaign_id_date_hour_platform_source_key" ON "metrics"("tenant_id", "campaign_id", "date", "hour", "platform", "source");

-- CreateIndex
CREATE INDEX "alerts_tenant_id_idx" ON "alerts"("tenant_id");

-- CreateIndex
CREATE INDEX "alerts_is_active_idx" ON "alerts"("is_active");

-- CreateIndex
CREATE INDEX "alert_history_alert_id_idx" ON "alert_history"("alert_id");

-- CreateIndex
CREATE INDEX "alert_history_triggered_at_idx" ON "alert_history"("triggered_at" DESC);

-- CreateIndex
CREATE INDEX "reports_tenant_id_idx" ON "reports"("tenant_id");

-- CreateIndex
CREATE INDEX "reports_created_by_idx" ON "reports"("created_by");

-- CreateIndex
CREATE INDEX "ai_insights_tenant_id_idx" ON "ai_insights"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_insights_status_idx" ON "ai_insights"("status");

-- CreateIndex
CREATE INDEX "ai_insights_created_at_idx" ON "ai_insights"("created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_queries_tenant_id_idx" ON "ai_queries"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_queries_user_id_idx" ON "ai_queries"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_queries" ADD CONSTRAINT "ai_queries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_queries" ADD CONSTRAINT "ai_queries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
