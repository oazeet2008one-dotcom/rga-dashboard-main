import { Controller, Get, Query, UseGuards, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CrmService } from './crm.service';
import { GetCrmSummaryDto, CrmSummaryResponseDto } from './dto/crm-summary.dto';
import { UserRole } from '@prisma/client';

@ApiTags('CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get CRM summary metrics' })
  @ApiResponse({ status: 200, type: CrmSummaryResponseDto })
  async getSummary(
    @CurrentUser() user: any,
    @Query() query: GetCrmSummaryDto,
  ) {
    const tenantId = query.tenantId && user.role === UserRole.SUPER_ADMIN ? query.tenantId : user.tenantId;
    return this.crmService.getSummary(tenantId, query);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get CRM pipeline trends' })
  async getPipelineTrends(
    @CurrentUser() user: any,
    @Query('days') days?: number,
    @Query('tenantId') tenantIdQuery?: string,
  ) {
    const tenantId = tenantIdQuery && user.role === UserRole.SUPER_ADMIN ? tenantIdQuery : user.tenantId;
    return this.crmService.getPipelineTrends(tenantId, days ? Number(days) : 30);
  }
}
