-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "company" VARCHAR(255),
    "source" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL,
    "stage" VARCHAR(50) NOT NULL,
    "gender" VARCHAR(20),
    "income" DECIMAL(15,2),
    "estimated_value" DECIMAL(15,2),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_metrics" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "metricType" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "numeric_value" DECIMAL(15,4),
    "volume" INTEGER,
    "sessions" INTEGER,
    "share" DECIMAL(10,4),
    "trend" VARCHAR(20),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_kpis" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "section" VARCHAR(50) NOT NULL,
    "metric" VARCHAR(255) NOT NULL,
    "condition" VARCHAR(10),
    "threshold" DECIMAL(15,4),
    "threshold_text" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_tenant_id_idx" ON "leads"("tenant_id");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "seo_metrics_tenant_id_idx" ON "seo_metrics"("tenant_id");

-- CreateIndex
CREATE INDEX "seo_metrics_metricType_idx" ON "seo_metrics"("metricType");

-- CreateIndex
CREATE INDEX "tenant_kpis_tenant_id_idx" ON "tenant_kpis"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_kpis_section_idx" ON "tenant_kpis"("section");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_metrics" ADD CONSTRAINT "seo_metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_kpis" ADD CONSTRAINT "tenant_kpis_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
