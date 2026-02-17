import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SeoService } from './seo.service';

@ApiTags('SEO')
@ApiBearerAuth()
@Controller('seo')
@UseGuards(JwtAuthGuard)
export class SeoController {
    constructor(private readonly seoService: SeoService) { }

    // --- Endpoints from HEAD (Current) ---

    @Get('summary')
    @ApiOperation({ summary: 'Get SEO summary metrics' })
    async getSummary(@CurrentUser() user: any) {
        return this.seoService.getSeoSummary(user.tenantId);
    }

    @Get('history')
    @ApiOperation({ summary: 'Get SEO history for chart' })
    async getHistory(@CurrentUser() user: any, @Query('days') days?: number) {
        return this.seoService.getSeoHistory(user.tenantId, days ? Number(days) : 30);
    }

    @Get('keyword-intent')
    @ApiOperation({ summary: 'Get SEO keyword intent breakdown' })
    async getKeywordIntent(@CurrentUser() user: any) {
        return this.seoService.getSeoKeywordIntent(user.tenantId);
    }

    @Get('traffic-by-location')
    @ApiOperation({ summary: 'Get SEO traffic by location' })
    async getTrafficByLocation(@CurrentUser() user: any) {
        return this.seoService.getSeoTrafficByLocation(user.tenantId);
    }

    // --- Endpoints from Incoming (WIP) ---

    @Get('overview')
    @ApiOperation({ summary: 'Get SEO overview (GA4 + GSC)' })
    @ApiQuery({ name: 'period', required: false, description: 'Time period (7d, 14d, 30d, 90d). Default: 30d' })
    async getSeoOverview(
        @CurrentUser('tenantId') tenantId: string,
        @Query('period') period?: string,
    ) {
        return this.seoService.getOverview(tenantId, period);
    }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get SEO dashboard details (trends + top breakdown)' })
    @ApiQuery({ name: 'period', required: false, description: 'Time period (7d, 14d, 30d, 90d). Default: 30d' })
    @ApiQuery({ name: 'limit', required: false, description: 'Top N breakdown rows. Default: 10' })
    async getSeoDashboard(
        @CurrentUser('tenantId') tenantId: string,
        @Query('period') period?: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? Math.max(1, parseInt(limit, 10) || 10) : 10;
        return this.seoService.getDashboard(tenantId, period, limitNum);
    }

    @Post('sync/gsc')
    @ApiOperation({ summary: 'Manually sync Google Search Console data into DB' })
    @ApiQuery({ name: 'days', required: false, description: 'How many days back to sync. Default: 30' })
    async syncGsc(
        @CurrentUser('tenantId') tenantId: string,
        @Query('days') days?: string,
    ) {
        const daysNum = days ? Math.max(1, parseInt(days, 10) || 30) : 30;
        return this.seoService.syncGscForTenant(tenantId, { days: daysNum });
    }
    @Get('top-keywords')
    @ApiOperation({ summary: 'Get top organic keywords' })
    async getTopKeywords(@CurrentUser() user: any) {
        return this.seoService.getTopKeywords(user.tenantId);
    }

    @Get('offpage-snapshots')
    @ApiOperation({ summary: 'Get SEO offpage snapshots' })
    async getOffpageSnapshots(@CurrentUser() user: any) {
        return this.seoService.getOffpageSnapshots(user.tenantId);
    }

    @Get('anchor-texts')
    @ApiOperation({ summary: 'Get SEO anchor texts' })
    async getAnchorTexts(@CurrentUser() user: any) {
        return this.seoService.getAnchorTexts(user.tenantId);
    }

    @Get('ai-insights')
    @ApiOperation({ summary: 'Get AI insights for Google Assistant' })
    async getAiInsights(@CurrentUser() user: any) {
        return this.seoService.getAiInsights(user.tenantId);
    }
}
