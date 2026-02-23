import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationsSummaryService } from './integrations-summary.service';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsSummaryController {
  constructor(private readonly summaryService: IntegrationsSummaryService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get integrations connection summary' })
  async getSummary(@Req() req: any) {
    return this.summaryService.getSummary(req.user.tenantId);
  }
}
