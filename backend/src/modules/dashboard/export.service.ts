import { Injectable, Logger, InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from './metrics.service';
import { stringify } from 'csv-stringify';
import { PassThrough } from 'stream';
import * as PDFDocument from 'pdfkit';

// ============================================================================
// Constants
// ============================================================================

/** UTF-8 BOM for Excel Thai language support */
const UTF8_BOM = '\uFEFF';

/** Batch size for cursor pagination (memory-efficient) */
const BATCH_SIZE = 500;

/** CSV column definitions for streaming export */
const CSV_COLUMNS = [
    { key: 'date', header: 'Date' },
    { key: 'campaignName', header: 'Campaign Name' },
    { key: 'platform', header: 'Platform' },
    { key: 'status', header: 'Status' },
    { key: 'spend', header: 'Spend ($)' },
    { key: 'impressions', header: 'Impressions' },
    { key: 'clicks', header: 'Clicks' },
    { key: 'ctr', header: 'CTR (%)' },
    { key: 'cpc', header: 'CPC ($)' },
];

/** Characters that trigger formula execution in Excel (CSV Injection) */
const DANGEROUS_CSV_CHARS = /^[=+\-@\t\r]/;

const PDF_LAYOUT = {
    MARGIN: 50,
    COLUMN_WIDTHS: {
        COL1: 50,
        COL2: 200,
        COL3: 320,
        COL4: 440,
    },
    ROW_HEIGHT: 25,
};

// ============================================================================
// Export Query DTO Interface
// ============================================================================

export interface ExportCampaignsQuery {
    startDate: Date;
    endDate: Date;
    platform?: string;
    status?: string;
}

// ============================================================================
// Export Service (Streaming Architecture)
// ============================================================================

@Injectable()
export class ExportService {
    private readonly logger = new Logger(ExportService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly metricsService: MetricsService,
    ) { }

    // ========================================================================
    // Streaming CSV Export (NEW - Memory Efficient)
    // ========================================================================

    /**
     * Stream campaigns to CSV using cursor-based pagination
     * Memory-efficient: processes BATCH_SIZE rows at a time
     * 
     * @param tenantId - Tenant ID
     * @param query - Export query parameters with date range
     * @returns StreamableFile for piping to response
     */
    async streamCampaignsCSV(
        tenantId: string,
        query: ExportCampaignsQuery,
    ): Promise<StreamableFile> {
        const { startDate, endDate, platform, status } = query;

        this.logger.log(
            `Starting streaming CSV export for tenant ${tenantId} ` +
            `(${startDate.toISOString()} to ${endDate.toISOString()})`
        );

        // Create CSV stringifier with headers
        const stringifier = stringify({
            header: true,
            columns: CSV_COLUMNS,
        });

        // Create a PassThrough stream to pipe data
        const passThrough = new PassThrough();

        // Write UTF-8 BOM first for Excel Thai language support
        passThrough.write(UTF8_BOM);

        // Pipe stringifier output to passThrough
        stringifier.pipe(passThrough);

        // Start background streaming (non-blocking)
        this.streamDataInBackground(
            tenantId,
            startDate,
            endDate,
            platform,
            status,
            stringifier,
        ).catch((error) => {
            this.logger.error('Streaming export failed', error);
            stringifier.destroy(error);
        });

        // Generate filename with date range
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        const filename = `campaigns-${startStr}-to-${endStr}.csv`;

        return new StreamableFile(passThrough, {
            type: 'text/csv; charset=utf-8',
            disposition: `attachment; filename="${filename}"`,
        });
    }

    /**
     * Background streaming with cursor-based pagination
     * Fetches data in batches to prevent memory overload
     */
    private async streamDataInBackground(
        tenantId: string,
        startDate: Date,
        endDate: Date,
        platform: string | undefined,
        status: string | undefined,
        stringifier: ReturnType<typeof stringify>,
    ): Promise<void> {
        let cursor: string | undefined;
        let hasMore = true;
        let totalRows = 0;

        try {
            while (hasMore) {
                // Build where clause with filters
                const where: any = {
                    tenantId,
                    metrics: {
                        some: {
                            date: { gte: startDate, lte: endDate },
                        },
                    },
                };
                if (platform) where.platform = platform;
                if (status) where.status = status;

                // Fetch batch with cursor pagination
                const campaigns = await this.prisma.campaign.findMany({
                    where,
                    include: {
                        metrics: {
                            where: {
                                date: { gte: startDate, lte: endDate },
                            },
                        },
                    },
                    take: BATCH_SIZE,
                    ...(cursor && {
                        skip: 1,
                        cursor: { id: cursor },
                    }),
                    orderBy: { id: 'asc' },
                });

                // Write each campaign to stream
                for (const campaign of campaigns) {
                    const aggregated = this.aggregateMetrics(campaign.metrics);

                    stringifier.write({
                        date: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
                        campaignName: this.sanitizeCSVValue(campaign.name),
                        platform: campaign.platform,
                        status: campaign.status,
                        spend: aggregated.spend.toFixed(2),
                        impressions: aggregated.impressions,
                        clicks: aggregated.clicks,
                        ctr: aggregated.ctr.toFixed(2),
                        cpc: aggregated.cpc.toFixed(2),
                    });
                    totalRows++;
                }

                // Update cursor and check for more data
                if (campaigns.length < BATCH_SIZE) {
                    hasMore = false;
                } else {
                    cursor = campaigns[campaigns.length - 1].id;
                }
            }

            this.logger.log(`Streaming export completed: ${totalRows} rows exported`);
        } finally {
            stringifier.end(); // Signal end of stream
        }
    }

    /**
     * Aggregate metrics from an array into summary values
     */
    private aggregateMetrics(metrics: any[]): {
        spend: number;
        impressions: number;
        clicks: number;
        ctr: number;
        cpc: number;
    } {
        const spend = metrics.reduce((sum, m) => sum + Number(m.spend || 0), 0);
        const impressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
        const clicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);

        return {
            spend,
            impressions,
            clicks,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? spend / clicks : 0,
        };
    }

    // ========================================================================
    // PDF Export (Unchanged from original)
    // ========================================================================

    /**
     * Export metrics to PDF
     * @param tenantId - Tenant ID
     * @param period - Time period ('7d' or '30d')
     * @throws InternalServerErrorException on any failure
     */
    async exportMetricsToPDF(
        tenantId: string,
        period: '7d' | '30d',
    ): Promise<Buffer> {
        try {
            // Get metrics data
            const trends = await this.metricsService.getMetricsTrends(
                tenantId,
                period,
                'previous_period',
            );

            const dailyMetrics = await this.metricsService.getDailyMetrics(
                tenantId,
                period,
            );

            // Get tenant info
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
            });

            // Create PDF
            const doc = new PDFDocument({ margin: PDF_LAYOUT.MARGIN });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));

            // Header
            doc
                .fontSize(24)
                .font('Helvetica-Bold')
                .text('Campaign Performance Report', { align: 'center' });
            doc.moveDown();

            doc
                .fontSize(12)
                .font('Helvetica')
                .text(`Tenant: ${tenant?.name ?? tenantId}`, { align: 'center' });
            doc.text(`Period: ${period === '7d' ? 'Last 7 Days' : 'Last 30 Days'}`, {
                align: 'center',
            });
            doc.text(
                `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                { align: 'center' },
            );
            doc.moveDown(2);

            // Summary Section
            doc.fontSize(18).font('Helvetica-Bold').text('Summary');
            doc.moveDown();

            doc.fontSize(12).font('Helvetica');

            // Safe access with nullish coalescing
            const current = trends?.current ?? {
                impressions: 0,
                clicks: 0,
                spend: 0,
                conversions: 0,
                revenue: 0,
                ctr: 0,
                roas: 0,
            };
            const previous = trends?.previous;
            const trendData = trends?.trends;

            const summary = [
                ['Metric', 'Current', 'Previous', 'Change'],
                [
                    'Impressions',
                    current.impressions.toLocaleString(),
                    previous?.impressions?.toLocaleString() ?? 'N/A',
                    trendData?.impressions != null
                        ? `${trendData.impressions > 0 ? '+' : ''}${trendData.impressions.toFixed(1)}%`
                        : 'N/A',
                ],
                [
                    'Clicks',
                    current.clicks.toLocaleString(),
                    previous?.clicks?.toLocaleString() ?? 'N/A',
                    trendData?.clicks != null
                        ? `${trendData.clicks > 0 ? '+' : ''}${trendData.clicks.toFixed(1)}%`
                        : 'N/A',
                ],
                [
                    'Spend',
                    `$${current.spend.toFixed(2)}`,
                    previous?.spend != null ? `$${previous.spend.toFixed(2)}` : 'N/A',
                    trendData?.spend != null
                        ? `${trendData.spend > 0 ? '+' : ''}${trendData.spend.toFixed(1)}%`
                        : 'N/A',
                ],
                [
                    'Conversions',
                    current.conversions.toFixed(0),
                    previous?.conversions?.toFixed(0) ?? 'N/A',
                    trendData?.conversions != null
                        ? `${trendData.conversions > 0 ? '+' : ''}${trendData.conversions.toFixed(1)}%`
                        : 'N/A',
                ],
                [
                    'Revenue',
                    `$${current.revenue.toFixed(2)}`,
                    previous?.revenue != null ? `$${previous.revenue.toFixed(2)}` : 'N/A',
                    trendData?.revenue != null
                        ? `${trendData.revenue > 0 ? '+' : ''}${trendData.revenue.toFixed(1)}%`
                        : 'N/A',
                ],
                [
                    'CTR',
                    `${current.ctr.toFixed(2)}%`,
                    previous?.ctr != null ? `${previous.ctr.toFixed(2)}%` : 'N/A',
                    trendData?.ctr != null
                        ? `${trendData.ctr > 0 ? '+' : ''}${trendData.ctr.toFixed(1)}%`
                        : 'N/A',
                ],
                [
                    'ROAS',
                    current.roas.toFixed(2),
                    previous?.roas?.toFixed(2) ?? 'N/A',
                    trendData?.roas != null
                        ? `${trendData.roas > 0 ? '+' : ''}${trendData.roas.toFixed(1)}%`
                        : 'N/A',
                ],
            ];

            // Draw table
            const tableTop = doc.y;
            const col1X = PDF_LAYOUT.COLUMN_WIDTHS.COL1;
            const col2X = PDF_LAYOUT.COLUMN_WIDTHS.COL2;
            const col3X = PDF_LAYOUT.COLUMN_WIDTHS.COL3;
            const col4X = PDF_LAYOUT.COLUMN_WIDTHS.COL4;
            const rowHeight = PDF_LAYOUT.ROW_HEIGHT;

            // Table header
            doc.font('Helvetica-Bold');
            doc.text(summary[0][0], col1X, tableTop);
            doc.text(summary[0][1], col2X, tableTop);
            doc.text(summary[0][2], col3X, tableTop);
            doc.text(summary[0][3], col4X, tableTop);

            // Table rows
            doc.font('Helvetica');
            for (let i = 1; i < summary.length; i++) {
                const y = tableTop + i * rowHeight;
                doc.text(summary[i][0], col1X, y);
                doc.text(summary[i][1], col2X, y);
                doc.text(summary[i][2], col3X, y);
                doc.text(summary[i][3], col4X, y);
            }

            doc.moveDown(summary.length + 2);

            // Daily Metrics Section
            doc.fontSize(18).font('Helvetica-Bold').text('Daily Metrics');
            doc.moveDown();

            doc.fontSize(10).font('Helvetica');

            // Safe access to dailyMetrics.data
            const dailyData = dailyMetrics?.data ?? [];
            if (dailyData.length === 0) {
                doc.text('No daily metrics available for this period.');
            } else {
                dailyData.slice(0, 10).forEach((day, index) => {
                    if (index > 0 && index % 5 === 0) doc.moveDown();
                    doc.text(
                        `${this.formatDateSafe(day?.date)}: ${(day?.clicks ?? 0).toLocaleString()} clicks, $${(day?.spend ?? 0).toFixed(2)} spend, ${day?.conversions ?? 0} conversions`,
                    );
                });
            }

            // Footer
            doc
                .fontSize(8)
                .font('Helvetica')
                .text(
                    'This report is generated automatically by RGA Dashboard',
                    PDF_LAYOUT.MARGIN,
                    doc.page.height - PDF_LAYOUT.MARGIN,
                    { align: 'center' },
                );

            doc.end();

            return new Promise((resolve, reject) => {
                doc.on('end', () => {
                    resolve(Buffer.concat(chunks));
                });
                doc.on('error', (err) => {
                    reject(err);
                });
            });

        } catch (error) {
            this.logger.error(
                `PDF Export failed for tenant ${tenantId}`,
                error instanceof Error ? error.stack : error,
            );
            throw new InternalServerErrorException(
                'Failed to export metrics to PDF. Please try again later.',
            );
        }
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /**
     * Sanitize CSV values to prevent CSV Injection attacks
     * Escapes dangerous characters that could trigger formula execution in Excel
     * @param value - Value to sanitize
     * @returns Sanitized string safe for CSV
     */
    private sanitizeCSVValue(value: unknown): string {
        if (value == null) {
            return '';
        }

        const strValue = String(value);

        // Prefix with single quote if starts with dangerous characters
        // This prevents Excel from interpreting it as a formula
        if (DANGEROUS_CSV_CHARS.test(strValue)) {
            return "'" + strValue;
        }

        return strValue;
    }

    /**
     * Safely format date with null/undefined guards
     * @param date - Date to format (may be null/undefined)
     * @returns Formatted date string or 'N/A'
     */
    private formatDateSafe(date: Date | null | undefined): string {
        if (!date) {
            return 'N/A';
        }

        try {
            return date.toISOString().split('T')[0];
        } catch {
            return 'N/A';
        }
    }
}
