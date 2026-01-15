-- CreateTable
CREATE TABLE "integration_notifications" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "integration_id" UUID,
    "platform" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'warning',
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "title" VARCHAR(255) NOT NULL,
    "reason" VARCHAR(500),
    "action_url" VARCHAR(500),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integration_notifications_tenant_id_idx" ON "integration_notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "integration_notifications_integration_id_idx" ON "integration_notifications"("integration_id");

-- CreateIndex
CREATE INDEX "integration_notifications_platform_idx" ON "integration_notifications"("platform");

-- CreateIndex
CREATE INDEX "integration_notifications_status_idx" ON "integration_notifications"("status");

-- AddForeignKey
ALTER TABLE "integration_notifications" ADD CONSTRAINT "integration_notifications_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_notifications" ADD CONSTRAINT "integration_notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
