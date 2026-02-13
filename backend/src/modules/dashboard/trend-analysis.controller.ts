import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TrendAnalysisService } from './trend-analysis.service';
import { GetTrendAnalysisDto, TrendDataResponseDto } from './dto/trend-analysis.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Trends')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trends')
export class TrendAnalysisController {
  constructor(private readonly trendAnalysisService: TrendAnalysisService) {}

  @Get()
  @ApiOperation({ summary: 'Get trend analysis data' })
  @ApiResponse({ status: 200, type: [TrendDataResponseDto] })
  async getTrends(
    @CurrentUser() user: any,
    @Query() query: GetTrendAnalysisDto,
  ) {
    const tenantId = query.tenantId && user.role === UserRole.SUPER_ADMIN ? query.tenantId : user.tenantId;
    return this.trendAnalysisService.getTrends(tenantId, query);
  }
}
