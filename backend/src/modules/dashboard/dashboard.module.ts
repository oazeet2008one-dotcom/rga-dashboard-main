import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { ExportController } from './export.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MetricsService } from './metrics.service';
import { ExportService } from './export.service';
import { MockDataSeederService } from './mock-data-seeder.service';
import { IntegrationSwitchService } from '../data-sources/integration-switch.service';
import { IntegrationErrorHandler } from '../integrations/common/integration-error.handler';
import { EcommerceController } from './ecommerce.controller';
import { CrmController } from './crm.controller';
import { EcommerceService } from './ecommerce.service';
import { CrmService } from './crm.service';
import { EcommerceRollupService } from './ecommerce-rollup.service';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { TrendAnalysisController } from './trend-analysis.controller';
import { TrendAnalysisService } from './trend-analysis.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    DashboardController,
    ExportController,
    EcommerceController,
    CrmController,
    InsightsController,
    TrendAnalysisController
  ],
  providers: [
    DashboardService,
    MetricsService,
    ExportService,
    MockDataSeederService,
    IntegrationSwitchService,
    IntegrationErrorHandler,
    EcommerceService,
    CrmService,
    EcommerceRollupService,
    InsightsService,
    TrendAnalysisService
  ],
  exports: [
    DashboardService,
    MetricsService,
    ExportService,
    MockDataSeederService,
    IntegrationSwitchService
  ],
})
export class DashboardModule { }
