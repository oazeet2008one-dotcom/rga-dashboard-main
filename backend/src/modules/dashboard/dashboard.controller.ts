import { Controller, Get, Post, Delete, Query, UseGuards, Request, Res, UseInterceptors, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { MetricsService } from './metrics.service';
import { ExportService } from './export.service';
import { GetDashboardOverviewDto, DashboardOverviewResponseDto, PeriodEnum } from './dto/dashboard-overview.dto';
import { TenantCacheInterceptor } from '../../common/interceptors/tenant-cache.interceptor';
import { IntegrationSwitchService } from '../data-sources/integration-switch.service';
import { DateRangeUtil } from '../../common/utils/date-range.util';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantCacheInterceptor)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly metricsService: MetricsService,
    private readonly exportService: ExportService,
    private readonly integrationSwitchService: IntegrationSwitchService,
  ) { }

  /**
   * Dashboard Overview API (v1.0)
   * Returns aggregated metrics, growth, trends, and recent campaigns
   * Uses IntegrationSwitchService to toggle between Real & Mock Data
   */
  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview data (Smart Switch: Demo vs Live)' })
  @ApiQuery({ name: 'period', enum: PeriodEnum, required: false })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant override (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Dashboard overview data', type: DashboardOverviewResponseDto })
  async getOverview(
    @CurrentUser() user: any,
    @Query() query: GetDashboardOverviewDto,
  ) {
    // Delegate to the Switch Service
    return this.integrationSwitchService.getDashboardOverview(user, query);
  }

  @Get('metrics')
  async getMetrics(
    @CurrentUser('tenantId') tenantId: string,
    @Query('range') range: string,
    @Query('compare') compare: string,
  ) {
    const period = range || '7d';
    const compareWith = compare === 'previous_period' ? 'previous_period' : undefined;

    return this.metricsService.getMetricsTrends(tenantId, period, compareWith);
  }

  @Get('summary')
  async getSummary(@Request() req, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.dashboardService.getSummary(req.user.tenantId, daysNum);
  }

  @Get('summary-by-platform')
  async getSummaryByPlatform(
    @Request() req,
    @Query('days') days?: string,
    @Query('platform') platform?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const platformFilter = platform || 'ALL';
    return this.dashboardService.getSummaryByPlatform(req.user.tenantId, daysNum, platformFilter);
  }

  @Get('top-campaigns')
  async getTopCampaigns(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('days') days?: string,
  ) {
    // Robust parsing
    let limitNum = 5;
    if (limit) {
      const parsed = parseInt(limit, 10);
      if (!isNaN(parsed) && parsed > 0) limitNum = parsed;
    }

    const daysNum = days ? parseInt(days, 10) : 30;

    // Use Switch Service
    return this.integrationSwitchService.getTopCampaigns(req.user.tenantId, limitNum, daysNum);
  }

  @Get('trends')
  async getTrends(@Request() req, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.dashboardService.getTrends(req.user.tenantId, daysNum);
  }

  @Get('performance-by-platform')
  async getPerformanceByPlatform(@Request() req, @Query('startDate') startDate?: string) {
    let days = 30;
    if (startDate && startDate.endsWith('d')) {
      days = parseInt(startDate.replace('d', ''), 10);
    }
    return this.dashboardService.getPerformanceByPlatform(req.user.tenantId, days);
  }

  @Get('time-series')
  @ApiOperation({ summary: 'Get time-series for a single metric' })
  @ApiQuery({ name: 'metric', required: true, description: 'Metric name (impressions, clicks, spend, conversions, revenue, sessions)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD). If omitted, defaults to last 30 days.' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD). If omitted, defaults to today.' })
  @ApiResponse({ status: 200, description: 'Time-series data' })
  async getTimeSeries(
    @CurrentUser('tenantId') tenantId: string,
    @Query('metric') metric: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    const allowedMetrics = new Set([
      'impressions',
      'clicks',
      'spend',
      'conversions',
      'revenue',
      'sessions',
    ]);

    if (!metric || !allowedMetrics.has(metric)) {
      throw new BadRequestException('Invalid metric. Allowed: impressions, clicks, spend, conversions, revenue, sessions');
    }

    let startDate: Date;
    let endDate: Date;

    if (startDateStr || endDateStr) {
      if (!startDateStr || !endDateStr) {
        throw new BadRequestException('startDate and endDate must be provided together');
      }

      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);

      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid startDate format. Use YYYY-MM-DD.');
      }
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid endDate format. Use YYYY-MM-DD.');
      }
      if (startDate > endDate) {
        throw new BadRequestException('startDate must be before or equal to endDate');
      }
    } else {
      const range30 = DateRangeUtil.getDateRange(30);
      startDate = range30.startDate;
      endDate = range30.endDate;
    }

    return this.metricsService.getTimeSeries(
      tenantId,
      metric as 'impressions' | 'clicks' | 'spend' | 'conversions' | 'revenue' | 'sessions',
      startDate,
      endDate,
    );
  }

  @Get('metrics/trends')
  async getMetricsTrends(
    @CurrentUser() user: any,
    @Query('period') period: string = '7d',
    @Query('compare') compare?: 'previous_period',
  ) {
    return this.metricsService.getMetricsTrends(user.tenantId, period, compare);
  }

  @Get('metrics/daily')
  async getDailyMetrics(
    @CurrentUser() user: any,
    @Query('period') period: string = '7d',
  ) {
    return this.metricsService.getDailyMetrics(user.tenantId, period);
  }

  @Get('export/campaigns/csv')
  async exportCampaignsCSV(
    @CurrentUser() user: any,
    @Query('platform') platform?: string,
    @Query('status') status?: string,
  ) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return this.exportService.streamCampaignsCSV(user.tenantId, {
      startDate,
      endDate,
      platform,
      status,
    });
  }

  @Get('export/metrics/pdf')
  async exportMetricsPDF(
    @CurrentUser() user: any,
    @Query('period') period: '7d' | '30d' = '7d',
    @Res() res?: Response,
  ) {
    const pdf = await this.exportService.exportMetricsToPDF(user.tenantId, period);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=metrics-${period}-${new Date().toISOString().split('T')[0]}.pdf`,
    );
    res.send(pdf);
  }

  @Get('onboarding-status')
  async getOnboardingStatus(@CurrentUser('tenantId') tenantId: string) {
    return this.dashboardService.getOnboardingStatus(tenantId);
  }
}
