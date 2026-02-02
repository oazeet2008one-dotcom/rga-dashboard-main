import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeUtil } from '../../common/utils/date-range.util';
import { GoogleSearchConsoleService } from './google-search-console.service';

function toNumber(value: Prisma.Decimal | number | string | null | undefined, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') {
        const n = Number(value);
        return Number.isFinite(n) ? n : defaultValue;
    }
    if (typeof value === 'object' && 'toNumber' in value) return (value as any).toNumber();
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
}

function toIsoDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
}

function utcDateOnlyFromIso(dateStr: string): Date {
    return new Date(`${dateStr}T00:00:00.000Z`);
}

function calculateCtr(clicks: number, impressions: number): number {
    if (impressions <= 0) return 0;
    return clicks / impressions;
}

@Injectable()
export class SeoService {
    private readonly logger = new Logger(SeoService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly gscService: GoogleSearchConsoleService,
    ) { }

    async getOverview(tenantId: string, period?: string) {
        const days = DateRangeUtil.parsePeriodDays(period || '30d');
        const { startDate, endDate } = DateRangeUtil.getDateRange(days);

        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { settings: true },
        });

        const configuredSiteUrl = this.gscService.getSiteUrl(tenant?.settings);
        const hasCredentials = this.gscService.hasCredentials();
        let siteUrl = configuredSiteUrl;
        let gscDataCount = 0;

        if (siteUrl) {
            gscDataCount = await this.prisma.searchConsolePerformance.count({
                where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate } },
            });

            if (gscDataCount === 0) {
                const latest = await this.prisma.searchConsolePerformance.findFirst({
                    where: { tenantId },
                    orderBy: { date: 'desc' },
                    select: { siteUrl: true },
                });

                if (latest?.siteUrl && latest.siteUrl !== siteUrl) {
                    siteUrl = latest.siteUrl;
                    gscDataCount = await this.prisma.searchConsolePerformance.count({
                        where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate } },
                    });
                }
            }
        } else {
            const latest = await this.prisma.searchConsolePerformance.findFirst({
                where: { tenantId },
                orderBy: { date: 'desc' },
                select: { siteUrl: true },
            });

            if (latest?.siteUrl) {
                siteUrl = latest.siteUrl;
                gscDataCount = await this.prisma.searchConsolePerformance.count({
                    where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate } },
                });
            }
        }

        const gscConnected = (!!configuredSiteUrl && hasCredentials) || gscDataCount > 0;

        const ga4Account = await this.prisma.googleAnalyticsAccount.findFirst({
            where: { tenantId, status: 'ACTIVE' },
            select: { id: true },
        });
        const ga4Connected = !!ga4Account;

        const ga4Agg = await this.prisma.webAnalyticsDaily.aggregate({
            where: { tenantId, date: { gte: startDate, lte: endDate } },
            _sum: {
                activeUsers: true,
                newUsers: true,
                sessions: true,
                screenPageViews: true,
            },
            _avg: {
                engagementRate: true,
                bounceRate: true,
                avgSessionDuration: true,
            },
        });

        let gscClicks = 0;
        let gscImpressions = 0;
        let gscPositionAvg = 0;

        if (gscConnected) {
            const gscAgg = await this.prisma.searchConsolePerformance.aggregate({
                where: { tenantId, siteUrl: siteUrl!, date: { gte: startDate, lte: endDate } },
                _sum: { clicks: true, impressions: true },
                _avg: { position: true },
            });

            gscClicks = gscAgg._sum.clicks ?? 0;
            gscImpressions = gscAgg._sum.impressions ?? 0;
            gscPositionAvg = toNumber(gscAgg._avg.position);
        }

        return {
            connected: {
                ga4: ga4Connected,
                gsc: gscConnected,
            },
            dateRange: {
                from: toIsoDateOnly(startDate),
                to: toIsoDateOnly(endDate),
                days,
            },
            ga4: {
                activeUsers: ga4Agg._sum.activeUsers ?? 0,
                newUsers: ga4Agg._sum.newUsers ?? 0,
                sessions: ga4Agg._sum.sessions ?? 0,
                screenPageViews: ga4Agg._sum.screenPageViews ?? 0,
                engagementRateAvg: toNumber(ga4Agg._avg.engagementRate),
                bounceRateAvg: toNumber(ga4Agg._avg.bounceRate),
                avgSessionDurationAvg: toNumber(ga4Agg._avg.avgSessionDuration),
            },
            gsc: {
                siteUrl: siteUrl,
                clicks: gscClicks,
                impressions: gscImpressions,
                ctr: calculateCtr(gscClicks, gscImpressions),
                positionAvg: gscPositionAvg,
            },
        };
    }

    async getDashboard(tenantId: string, period?: string, limit: number = 10) {
        const days = DateRangeUtil.parsePeriodDays(period || '30d');
        const { startDate, endDate } = DateRangeUtil.getDateRange(days);

        const overview = await this.getOverview(tenantId, period);

        const ga4Daily = await this.prisma.webAnalyticsDaily.findMany({
            where: { tenantId, date: { gte: startDate, lte: endDate } },
            orderBy: { date: 'asc' },
            select: {
                date: true,
                activeUsers: true,
                newUsers: true,
                sessions: true,
                engagementRate: true,
                bounceRate: true,
                avgSessionDuration: true,
                screenPageViews: true,
            },
        });

        let gscDaily: Array<any> = [];
        let topQueries: Array<any> = [];
        let topPages: Array<any> = [];
        let topCountries: Array<any> = [];
        let topDevices: Array<any> = [];

        if (overview.connected.gsc && overview.gsc.siteUrl) {
            const siteUrl = overview.gsc.siteUrl;

            const dailyRows = await this.prisma.searchConsolePerformance.groupBy({
                by: ['date'],
                where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate } },
                _sum: { clicks: true, impressions: true },
                _avg: { position: true },
                orderBy: { date: 'asc' },
            });

            gscDaily = dailyRows.map((r) => {
                const clicks = r._sum.clicks ?? 0;
                const impressions = r._sum.impressions ?? 0;
                return {
                    date: toIsoDateOnly(r.date as any),
                    clicks,
                    impressions,
                    ctr: calculateCtr(clicks, impressions),
                    positionAvg: toNumber(r._avg.position),
                };
            });

            const [queries, pages, countries, devices] = await Promise.all([
                this.prisma.searchConsolePerformance.groupBy({
                    by: ['query'],
                    where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate }, query: { not: null } },
                    _sum: { clicks: true, impressions: true },
                    _avg: { position: true },
                    orderBy: { _sum: { clicks: 'desc' } },
                    take: limit,
                }),
                this.prisma.searchConsolePerformance.groupBy({
                    by: ['page'],
                    where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate }, page: { not: null } },
                    _sum: { clicks: true, impressions: true },
                    _avg: { position: true },
                    orderBy: { _sum: { clicks: 'desc' } },
                    take: limit,
                }),
                this.prisma.searchConsolePerformance.groupBy({
                    by: ['country'],
                    where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate }, country: { not: null } },
                    _sum: { clicks: true, impressions: true },
                    _avg: { position: true },
                    orderBy: { _sum: { clicks: 'desc' } },
                    take: limit,
                }),
                this.prisma.searchConsolePerformance.groupBy({
                    by: ['device'],
                    where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate }, device: { not: null } },
                    _sum: { clicks: true, impressions: true },
                    _avg: { position: true },
                    orderBy: { _sum: { clicks: 'desc' } },
                    take: limit,
                }),
            ]);

            topQueries = queries.map((r) => ({
                query: r.query,
                clicks: r._sum.clicks ?? 0,
                impressions: r._sum.impressions ?? 0,
                ctr: calculateCtr(r._sum.clicks ?? 0, r._sum.impressions ?? 0),
                positionAvg: toNumber(r._avg.position),
            }));

            topPages = pages.map((r) => ({
                page: r.page,
                clicks: r._sum.clicks ?? 0,
                impressions: r._sum.impressions ?? 0,
                ctr: calculateCtr(r._sum.clicks ?? 0, r._sum.impressions ?? 0),
                positionAvg: toNumber(r._avg.position),
            }));

            topCountries = countries.map((r) => ({
                country: r.country,
                clicks: r._sum.clicks ?? 0,
                impressions: r._sum.impressions ?? 0,
                ctr: calculateCtr(r._sum.clicks ?? 0, r._sum.impressions ?? 0),
                positionAvg: toNumber(r._avg.position),
            }));

            topDevices = devices.map((r) => ({
                device: r.device,
                clicks: r._sum.clicks ?? 0,
                impressions: r._sum.impressions ?? 0,
                ctr: calculateCtr(r._sum.clicks ?? 0, r._sum.impressions ?? 0),
                positionAvg: toNumber(r._avg.position),
            }));
        }

        return {
            overview,
            trends: {
                ga4: ga4Daily.map((d) => ({
                    date: toIsoDateOnly(d.date),
                    activeUsers: d.activeUsers,
                    newUsers: d.newUsers,
                    sessions: d.sessions,
                    engagementRate: toNumber(d.engagementRate),
                    bounceRate: toNumber(d.bounceRate),
                    avgSessionDuration: toNumber(d.avgSessionDuration),
                    screenPageViews: d.screenPageViews,
                })),
                gsc: gscDaily,
            },
            top: {
                queries: topQueries,
                pages: topPages,
                countries: topCountries,
                devices: topDevices,
            },
        };
    }

    async syncGscForTenant(tenantId: string, options?: { days?: number }) {
        const days = options?.days ?? 30;

        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { settings: true },
        });

        const siteUrl = this.gscService.getSiteUrl(tenant?.settings);
        if (!siteUrl || !this.gscService.hasCredentials()) {
            return { success: false, message: 'GSC not configured' };
        }

        const { startDate, endDate } = DateRangeUtil.getDateRange(days);
        const startDateStr = toIsoDateOnly(startDate);
        const endDateStr = toIsoDateOnly(endDate);

        const rowLimit = 25000;
        let startRow = 0;
        const allRows: any[] = [];

        while (true) {
            const report = await this.gscService.querySearchAnalytics({
                siteUrl,
                startDate: startDateStr,
                endDate: endDateStr,
                rowLimit,
                startRow,
            });

            const rows = (report.rows || []) as any[];
            if (!rows.length) break;

            allRows.push(...rows);

            if (rows.length < rowLimit) break;
            startRow += rowLimit;
        }

        const data = allRows
            .map((row) => {
                const keys = row.keys || [];
                const dateStr = keys[0];
                const page = keys[1] || null;
                const query = keys[2] || null;
                const device = keys[3] || null;
                const country = keys[4] || null;

                if (!dateStr) return null;

                const date = utcDateOnlyFromIso(dateStr);
                const externalKey = [dateStr, page || '', query || '', device || '', country || ''].join('|');

                return {
                    tenantId,
                    siteUrl,
                    date,
                    page,
                    query,
                    device,
                    country,
                    clicks: Math.trunc(Number(row.clicks || 0)),
                    impressions: Math.trunc(Number(row.impressions || 0)),
                    ctr: new Prisma.Decimal(Number(row.ctr || 0)),
                    position: new Prisma.Decimal(Number(row.position || 0)),
                    externalKey,
                };
            })
            .filter(Boolean) as any[];

        await this.prisma.searchConsolePerformance.deleteMany({
            where: {
                tenantId,
                siteUrl,
                date: { gte: startDate, lte: endDate },
            },
        });

        const chunkSize = 1000;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await this.prisma.searchConsolePerformance.createMany({
                data: chunk,
                skipDuplicates: true,
            });
        }

        this.logger.log(`[GSC Sync] Tenant ${tenantId}: inserted ${data.length} rows (${startDateStr}..${endDateStr})`);

        return {
            success: true,
            fetched: allRows.length,
            inserted: data.length,
            dateRange: { from: startDateStr, to: endDateStr },
            siteUrl,
        };
    }
}
