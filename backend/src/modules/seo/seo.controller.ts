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
}
