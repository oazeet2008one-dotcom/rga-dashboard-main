/*
  Warnings:

  - Added the required column `provider` to the `integrations` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ai_insights_created_at_idx";

-- AlterTable
ALTER TABLE "integrations" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "provider" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "admin_type" VARCHAR(50),
ADD COLUMN     "last_login_ip" VARCHAR(45),
ALTER COLUMN "role" SET DEFAULT 'user';

-- CreateTable
CREATE TABLE "sync_histories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "integration_id" UUID,
    "platform" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "data" JSONB,
    "error" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "data" JSONB NOT NULL,
    "signature" VARCHAR(500),
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "description" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "platform" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_states" (
    "id" UUID NOT NULL,
    "integration_id" UUID,
    "state" VARCHAR(255) NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_histories_tenant_id_idx" ON "sync_histories"("tenant_id");

-- CreateIndex
CREATE INDEX "sync_histories_integration_id_idx" ON "sync_histories"("integration_id");

-- CreateIndex
CREATE INDEX "sync_histories_platform_idx" ON "sync_histories"("platform");

-- CreateIndex
CREATE INDEX "sync_histories_synced_at_idx" ON "sync_histories"("synced_at" DESC);

-- CreateIndex
CREATE INDEX "webhook_events_tenant_id_idx" ON "webhook_events"("tenant_id");

-- CreateIndex
CREATE INDEX "webhook_events_platform_idx" ON "webhook_events"("platform");

-- CreateIndex
CREATE INDEX "webhook_events_type_idx" ON "webhook_events"("type");

-- CreateIndex
CREATE INDEX "webhook_events_received_at_idx" ON "webhook_events"("received_at");

-- CreateIndex
CREATE INDEX "activity_logs_tenant_id_idx" ON "activity_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_idx" ON "activity_logs"("entity_type");

-- CreateIndex
CREATE INDEX "activity_logs_platform_idx" ON "activity_logs"("platform");

-- CreateIndex
CREATE INDEX "activity_logs_status_idx" ON "activity_logs"("status");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_states_state_key" ON "oauth_states"("state");

-- CreateIndex
CREATE INDEX "oauth_states_state_idx" ON "oauth_states"("state");

-- CreateIndex
CREATE INDEX "oauth_states_integration_id_idx" ON "oauth_states"("integration_id");

-- CreateIndex
CREATE INDEX "oauth_states_expires_at_idx" ON "oauth_states"("expires_at");

-- CreateIndex
CREATE INDEX "ai_insights_campaign_id_idx" ON "ai_insights"("campaign_id");

-- CreateIndex
CREATE INDEX "ai_insights_insight_type_idx" ON "ai_insights"("insight_type");

-- CreateIndex
CREATE INDEX "ai_insights_priority_idx" ON "ai_insights"("priority");

-- CreateIndex
CREATE INDEX "ai_insights_created_at_idx" ON "ai_insights"("created_at");

-- CreateIndex
CREATE INDEX "integrations_provider_idx" ON "integrations"("provider");

-- CreateIndex
CREATE INDEX "integrations_is_active_idx" ON "integrations"("is_active");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- AddForeignKey
ALTER TABLE "sync_histories" ADD CONSTRAINT "sync_histories_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_histories" ADD CONSTRAINT "sync_histories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
