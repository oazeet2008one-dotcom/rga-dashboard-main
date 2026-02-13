import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SeoService } from './seo.service';

@ApiTags('SEO')
@ApiBearerAuth()
@Controller('seo')
@UseGuards(JwtAuthGuard)
export class SeoController {
    constructor(private readonly seoService: SeoService) { }

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
