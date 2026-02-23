import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsSummaryController } from './integrations-summary.controller';
import { IntegrationsSummaryService } from './integrations-summary.service';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsSummaryController],
  providers: [IntegrationsSummaryService],
  exports: [IntegrationsSummaryService],
})
export class IntegrationsSummaryModule {}
