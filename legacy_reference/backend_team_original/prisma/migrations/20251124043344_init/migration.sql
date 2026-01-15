/*
  Warnings:

  - The primary key for the `activity_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ai_insights` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ai_queries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `alert_history` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `metric_value` on the `alert_history` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,4)` to `DoublePrecision`.
  - You are about to alter the column `threshold_value` on the `alert_history` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,4)` to `DoublePrecision`.
  - The primary key for the `alerts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `threshold` on the `alerts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,4)` to `DoublePrecision`.
  - The primary key for the `audit_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `campaigns` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `budget` on the `campaigns` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `DoublePrecision`.
  - The primary key for the `integration_notifications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `integrations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `metrics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `spend` on the `metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `DoublePrecision`.
  - You are about to alter the column `cost_per_click` on the `metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `DoublePrecision`.
  - You are about to alter the column `cost_per_mille` on the `metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `DoublePrecision`.
  - You are about to alter the column `cost_per_action` on the `metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `DoublePrecision`.
  - You are about to alter the column `ctr` on the `metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(8,4)` to `DoublePrecision`.
  - You are about to alter the column `conversion_rate` on the `metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(8,4)` to `DoublePrecision`.
  - You are about to alter the column `roas` on the `metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,4)` to `DoublePrecision`.
  - You are about to alter the column `revenue` on the `metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `DoublePrecision`.
  - You are about to alter the column `cart_abandonment_rate` on the `metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(8,4)` to `DoublePrecision`.
  - You are about to alter the column `average_order_value` on the `metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `bounce_rate` on the `metrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(8,4)` to `DoublePrecision`.
  - The primary key for the `oauth_states` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `reports` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `schedule_time` column on the `reports` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `sync_histories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `tenant_kpis` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `threshold` on the `tenant_kpis` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,4)` to `DoublePrecision`.
  - The primary key for the `tenants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `webhook_events` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_insights" DROP CONSTRAINT "ai_insights_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_insights" DROP CONSTRAINT "ai_insights_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_queries" DROP CONSTRAINT "ai_queries_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_queries" DROP CONSTRAINT "ai_queries_user_id_fkey";

-- DropForeignKey
ALTER TABLE "alert_history" DROP CONSTRAINT "alert_history_alert_id_fkey";

-- DropForeignKey
ALTER TABLE "alert_history" DROP CONSTRAINT "alert_history_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_integration_id_fkey";

-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "integration_notifications" DROP CONSTRAINT "integration_notifications_integration_id_fkey";

-- DropForeignKey
ALTER TABLE "integration_notifications" DROP CONSTRAINT "integration_notifications_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "integrations" DROP CONSTRAINT "integrations_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "metrics" DROP CONSTRAINT "metrics_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "metrics" DROP CONSTRAINT "metrics_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "oauth_states" DROP CONSTRAINT "oauth_states_integration_id_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_created_by_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sync_histories" DROP CONSTRAINT "sync_histories_integration_id_fkey";

-- DropForeignKey
ALTER TABLE "sync_histories" DROP CONSTRAINT "sync_histories_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "tenant_kpis" DROP CONSTRAINT "tenant_kpis_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "seo_metrics" DROP CONSTRAINT IF EXISTS "seo_metrics_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "ui_assets" DROP CONSTRAINT IF EXISTS "ui_assets_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "webhook_events" DROP CONSTRAINT "webhook_events_tenant_id_fkey";

-- AlterTable
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "action" SET DATA TYPE TEXT,
ALTER COLUMN "entity_type" SET DATA TYPE TEXT,
ALTER COLUMN "entity_id" SET DATA TYPE TEXT,
ALTER COLUMN "metadata" SET DATA TYPE TEXT,
ALTER COLUMN "ip_address" SET DATA TYPE TEXT,
ALTER COLUMN "platform" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DATA TYPE TEXT,
ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ai_insights" DROP CONSTRAINT "ai_insights_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "campaign_id" SET DATA TYPE TEXT,
ALTER COLUMN "insight_type" SET DATA TYPE TEXT,
ALTER COLUMN "title" SET DATA TYPE TEXT,
ALTER COLUMN "analysis" SET DATA TYPE TEXT,
ALTER COLUMN "priority" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DATA TYPE TEXT,
ADD CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ai_queries" DROP CONSTRAINT "ai_queries_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "language" SET DATA TYPE TEXT,
ADD CONSTRAINT "ai_queries_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "alert_history" DROP CONSTRAINT "alert_history_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "alert_id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "metric_value" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "threshold_value" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "metadata" SET DATA TYPE TEXT,
ADD CONSTRAINT "alert_history_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "campaign_id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "alert_type" SET DATA TYPE TEXT,
ALTER COLUMN "metric" SET DATA TYPE TEXT,
ALTER COLUMN "operator" SET DATA TYPE TEXT,
ALTER COLUMN "threshold" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "notification_channels" SET DATA TYPE TEXT,
ALTER COLUMN "recipients" SET DATA TYPE TEXT,
ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "action" SET DATA TYPE TEXT,
ALTER COLUMN "entity_type" SET DATA TYPE TEXT,
ALTER COLUMN "entity_id" SET DATA TYPE TEXT,
ALTER COLUMN "changes" SET DATA TYPE TEXT,
ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "integration_id" SET DATA TYPE TEXT,
ALTER COLUMN "external_id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "platform" SET DATA TYPE TEXT,
ALTER COLUMN "campaign_type" SET DATA TYPE TEXT,
ALTER COLUMN "objective" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DATA TYPE TEXT,
ALTER COLUMN "budget" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "budget_type" SET DATA TYPE TEXT,
ALTER COLUMN "currency" SET DATA TYPE TEXT,
ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "end_date" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "integration_notifications" DROP CONSTRAINT "integration_notifications_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "integration_id" SET DATA TYPE TEXT,
ALTER COLUMN "platform" SET DATA TYPE TEXT,
ALTER COLUMN "severity" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DATA TYPE TEXT,
ALTER COLUMN "title" SET DATA TYPE TEXT,
ALTER COLUMN "reason" SET DATA TYPE TEXT,
ALTER COLUMN "action_url" SET DATA TYPE TEXT,
ALTER COLUMN "metadata" SET DATA TYPE TEXT,
ADD CONSTRAINT "integration_notifications_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "integrations" DROP CONSTRAINT "integrations_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "type" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "credentials" SET DATA TYPE TEXT,
ALTER COLUMN "config" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DATA TYPE TEXT,
ALTER COLUMN "provider" SET DATA TYPE TEXT,
ADD CONSTRAINT "integrations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "metrics" DROP CONSTRAINT "metrics_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "campaign_id" SET DATA TYPE TEXT,
ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "platform" SET DATA TYPE TEXT,
ALTER COLUMN "source" SET DATA TYPE TEXT,
ALTER COLUMN "spend" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "cost_per_click" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "cost_per_mille" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "cost_per_action" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "ctr" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "conversion_rate" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "roas" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "revenue" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "cart_abandonment_rate" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "average_order_value" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "bounce_rate" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "metadata" SET DATA TYPE TEXT,
ADD CONSTRAINT "metrics_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "oauth_states" DROP CONSTRAINT "oauth_states_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "integration_id" SET DATA TYPE TEXT,
ALTER COLUMN "state" SET DATA TYPE TEXT,
ADD CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "reports" DROP CONSTRAINT "reports_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "report_type" SET DATA TYPE TEXT,
ALTER COLUMN "date_range_type" SET DATA TYPE TEXT,
ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "end_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "filters" SET DATA TYPE TEXT,
ALTER COLUMN "metrics" SET DATA TYPE TEXT,
ALTER COLUMN "schedule_frequency" SET DATA TYPE TEXT,
DROP COLUMN "schedule_time",
ADD COLUMN     "schedule_time" TIMESTAMP(3),
ALTER COLUMN "export_format" SET DATA TYPE TEXT,
ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "roles" DROP CONSTRAINT "roles_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "permissions" SET DATA TYPE TEXT,
ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "token" SET DATA TYPE TEXT,
ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sync_histories" DROP CONSTRAINT "sync_histories_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "integration_id" SET DATA TYPE TEXT,
ALTER COLUMN "platform" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DATA TYPE TEXT,
ALTER COLUMN "data" SET DATA TYPE TEXT,
ADD CONSTRAINT "sync_histories_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tenant_kpis" DROP CONSTRAINT "tenant_kpis_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "section" SET DATA TYPE TEXT,
ALTER COLUMN "metric" SET DATA TYPE TEXT,
ALTER COLUMN "condition" SET DATA TYPE TEXT,
ALTER COLUMN "threshold" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "threshold_text" SET DATA TYPE TEXT,
ADD CONSTRAINT "tenant_kpis_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "password_hash" SET DATA TYPE TEXT,
ALTER COLUMN "first_name" SET DATA TYPE TEXT,
ALTER COLUMN "last_name" SET DATA TYPE TEXT,
ALTER COLUMN "phone" SET DATA TYPE TEXT,
ALTER COLUMN "avatar_url" SET DATA TYPE TEXT,
ALTER COLUMN "role" SET DATA TYPE TEXT,
ALTER COLUMN "admin_type" SET DATA TYPE TEXT,
ALTER COLUMN "last_login_ip" SET DATA TYPE TEXT,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "slug" SET DATA TYPE TEXT,
ALTER COLUMN "domain" SET DATA TYPE TEXT,
ALTER COLUMN "primary_color" SET DATA TYPE TEXT,
ALTER COLUMN "secondary_color" SET DATA TYPE TEXT,
ALTER COLUMN "timezone" SET DATA TYPE TEXT,
ALTER COLUMN "currency" SET DATA TYPE TEXT,
ALTER COLUMN "language" SET DATA TYPE TEXT,
ALTER COLUMN "subscription_plan" SET DATA TYPE TEXT,
ALTER COLUMN "subscription_status" SET DATA TYPE TEXT,
ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "webhook_events" DROP CONSTRAINT "webhook_events_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "platform" SET DATA TYPE TEXT,
ALTER COLUMN "type" SET DATA TYPE TEXT,
ALTER COLUMN "data" SET DATA TYPE TEXT,
ALTER COLUMN "signature" SET DATA TYPE TEXT,
ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "ui_assets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "thumbnail" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ui_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ui_assets_tenant_id_idx" ON "ui_assets"("tenant_id");

-- CreateIndex
CREATE INDEX "ui_assets_category_idx" ON "ui_assets"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ui_assets_tenant_id_file_name_key" ON "ui_assets"("tenant_id", "file_name");

-- AddForeignKey
ALTER TABLE "tenant_kpis" ADD CONSTRAINT "tenant_kpis_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_assets" ADD CONSTRAINT "ui_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "sync_histories" ADD CONSTRAINT "sync_histories_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_histories" ADD CONSTRAINT "sync_histories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_notifications" ADD CONSTRAINT "integration_notifications_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_notifications" ADD CONSTRAINT "integration_notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
