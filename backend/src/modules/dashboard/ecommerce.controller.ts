import { Controller, Get, Query, UseGuards, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EcommerceService } from './ecommerce.service';
import { EcommerceRollupService } from './ecommerce-rollup.service';
import { GetEcommerceSummaryDto, EcommerceSummaryResponseDto } from './dto/ecommerce-summary.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Ecommerce')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ecommerce')
export class EcommerceController {
  constructor(
    private readonly ecommerceService: EcommerceService,
    private readonly ecommerceRollupService: EcommerceRollupService,
  ) {}

  @Post('backfill')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Backfill ecommerce data (SUPER_ADMIN only)' })
  async backfill(
    @Query('tenantId') tenantId?: string,
    @Query('days') days?: number,
  ) {
    const safeDays = days ? Number(days) : 30;
    if (tenantId) {
      await this.ecommerceRollupService.backfillLastNDaysForTenant(tenantId, safeDays);
    } else {
      await this.ecommerceRollupService.backfillLastNDaysForAllTenants(safeDays);
    }
    return { success: true, days: safeDays };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get ecommerce summary metrics' })
  @ApiResponse({ status: 200, type: EcommerceSummaryResponseDto })
  async getSummary(
    @CurrentUser() user: any,
    @Query() query: GetEcommerceSummaryDto,
  ) {
    const tenantId = query.tenantId && user.role === UserRole.SUPER_ADMIN ? query.tenantId : user.tenantId;
    return this.ecommerceService.getSummary(tenantId, query);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get ecommerce sales trends' })
  async getSalesTrends(
    @CurrentUser() user: any,
    @Query('days') days?: number,
    @Query('tenantId') tenantIdQuery?: string,
  ) {
    const tenantId = tenantIdQuery && user.role === UserRole.SUPER_ADMIN ? tenantIdQuery : user.tenantId;
    return this.ecommerceService.getSalesTrends(tenantId, days ? Number(days) : 30);
  }
}
