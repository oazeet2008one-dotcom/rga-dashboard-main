import {
    Controller,
    Get,
    Query,
    UseGuards,
    Header,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExportService, ExportCampaignsQuery } from './export.service';

// ============================================================================
// Export Controller - Dedicated endpoint for streaming exports
// ============================================================================

@ApiTags('Export')
@ApiBearerAuth()
@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
    constructor(private readonly exportService: ExportService) { }

    /**
     * Export campaign performance report as streaming CSV
     * 
     * Uses cursor-based pagination to handle 10,000+ rows efficiently
     * without loading all data into memory.
     * 
     * @param tenantId - Current user's tenant ID (from JWT)
     * @param startDate - Start of date range (ISO format: YYYY-MM-DD)
     * @param endDate - End of date range (ISO format: YYYY-MM-DD)
     * @param platform - Optional platform filter
     * @param status - Optional status filter
     */
    @Get('campaigns')
    @ApiOperation({
        summary: 'Export campaign performance report as CSV',
        description: 'Streams campaign data with aggregated metrics for the specified date range. Memory-efficient for large datasets.',
    })
    @ApiQuery({
        name: 'startDate',
        required: true,
        type: String,
        example: '2026-01-01',
        description: 'Start of date range (YYYY-MM-DD)',
    })
    @ApiQuery({
        name: 'endDate',
        required: true,
        type: String,
        example: '2026-01-21',
        description: 'End of date range (YYYY-MM-DD)',
    })
    @ApiQuery({
        name: 'platform',
        required: false,
        enum: ['GOOGLE_ADS', 'FACEBOOK', 'TIKTOK', 'LINE_ADS'],
        description: 'Filter by ad platform',
    })
    @ApiQuery({
        name: 'status',
        required: false,
        enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'DRAFT'],
        description: 'Filter by campaign status',
    })
    @ApiResponse({
        status: 200,
        description: 'CSV file download',
        content: {
            'text/csv': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: 'Invalid date parameters' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @Header('Content-Type', 'text/csv; charset=utf-8')
    async exportCampaigns(
        @CurrentUser('tenantId') tenantId: string,
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('platform') platform?: string,
        @Query('status') status?: string,
    ) {
        // Validate required parameters
        if (!startDateStr || !endDateStr) {
            throw new BadRequestException('startDate and endDate are required');
        }

        // Parse and validate dates
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime())) {
            throw new BadRequestException('Invalid startDate format. Use YYYY-MM-DD.');
        }

        if (isNaN(endDate.getTime())) {
            throw new BadRequestException('Invalid endDate format. Use YYYY-MM-DD.');
        }

        if (startDate > endDate) {
            throw new BadRequestException('startDate must be before or equal to endDate');
        }

        // Build query object
        const query: ExportCampaignsQuery = {
            startDate,
            endDate,
            platform,
            status,
        };

        // Return streaming CSV
        return this.exportService.streamCampaignsCSV(tenantId, query);
    }

    /**
     * Export metrics report as PDF
     * 
     * @param tenantId - Current user's tenant ID (from JWT)
     * @param period - Time period ('7d' or '30d')
     */
    @Get('metrics/pdf')
    @ApiOperation({
        summary: 'Export metrics report as PDF',
        description: 'Generates a PDF report with summary metrics and daily breakdown.',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['7d', '30d'],
        description: 'Report period (default: 7d)',
    })
    @ApiResponse({
        status: 200,
        description: 'PDF file download',
        content: {
            'application/pdf': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @Header('Content-Type', 'application/pdf')
    async exportMetricsPDF(
        @CurrentUser('tenantId') tenantId: string,
        @Query('period') period: '7d' | '30d' = '7d',
    ) {
        const pdf = await this.exportService.exportMetricsToPDF(tenantId, period);

        // Note: Returning Buffer directly works with NestJS
        // The response handling is done via @Res() in dashboard.controller.ts
        // but here we return the buffer for StreamableFile compatibility
        return pdf;
    }
}
