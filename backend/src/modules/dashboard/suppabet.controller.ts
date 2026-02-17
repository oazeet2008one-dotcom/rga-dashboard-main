import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SuppabetService } from './suppabet.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard/suppabet')
@UseGuards(JwtAuthGuard)
export class SuppabetController {
    constructor(private readonly suppabetService: SuppabetService) { }

    @Get('matches')
    @ApiOperation({ summary: 'Get Suppabet matches' })
    async getMatches(
        @CurrentUser('tenantId') tenantId: string,
        @Query('days') days?: string,
    ) {
        return this.suppabetService.getMatches(tenantId, parseInt(days || '7', 10));
    }

    @Get('summary')
    @ApiOperation({ summary: 'Get Suppabet summary' })
    async getSummary(
        @CurrentUser('tenantId') tenantId: string,
        @Query('days') days?: string,
    ) {
        return this.suppabetService.getSummary(tenantId, parseInt(days || '30', 10));
    }
}
