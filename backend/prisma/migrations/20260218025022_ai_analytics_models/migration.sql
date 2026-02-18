-- CreateTable
CREATE TABLE "user_behavior" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_behavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "metrics" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    "confidence" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "event_type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'LOW',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_behavior_tenant" ON "user_behavior"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_user_behavior_user" ON "user_behavior"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_behavior_action" ON "user_behavior"("action");

-- CreateIndex
CREATE INDEX "idx_user_behavior_timestamp" ON "user_behavior"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_business_metrics_tenant" ON "business_metrics"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_business_metrics_timestamp" ON "business_metrics"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_ai_recommendations_tenant" ON "ai_recommendations"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_ai_recommendations_status_priority" ON "ai_recommendations"("tenant_id", "status", "priority");

-- CreateIndex
CREATE INDEX "idx_ai_recommendations_created" ON "ai_recommendations"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_security_events_tenant" ON "security_events"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_security_events_user" ON "security_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_security_events_type" ON "security_events"("event_type");

-- CreateIndex
CREATE INDEX "idx_security_events_severity" ON "security_events"("severity");

-- CreateIndex
CREATE INDEX "idx_security_events_timestamp" ON "security_events"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_chat_sessions_tenant" ON "chat_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_chat_sessions_user" ON "chat_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_chat_sessions_active" ON "chat_sessions"("is_active");

-- CreateIndex
CREATE INDEX "idx_chat_messages_tenant" ON "chat_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_chat_messages_session" ON "chat_messages"("session_id");

-- CreateIndex
CREATE INDEX "idx_chat_messages_role" ON "chat_messages"("role");

-- CreateIndex
CREATE INDEX "idx_chat_messages_created" ON "chat_messages"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "user_behavior" ADD CONSTRAINT "user_behavior_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_behavior" ADD CONSTRAINT "user_behavior_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_metrics" ADD CONSTRAINT "business_metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
