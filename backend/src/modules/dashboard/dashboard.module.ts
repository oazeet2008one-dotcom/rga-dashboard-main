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

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController, ExportController],
  providers: [
    DashboardService,
    MetricsService,
    ExportService,
    MockDataSeederService,
    IntegrationSwitchService,
    IntegrationErrorHandler
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
