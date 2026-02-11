import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class SeoService {
    constructor(private readonly prisma: PrismaService) { }

    async getSeoSummary(tenantId: string) {
        // Calculate date range (last 30 days default)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Fetch Current Period Data from WebAnalyticsDaily (GA4)
        const waMetrics = await this.prisma.webAnalyticsDaily.aggregate({
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                sessions: true,
                newUsers: true
            },
            _avg: { avgSessionDuration: true }
        });

        // Calculate previous period for trends
        const prevEndDate = new Date(startDate);
        const prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 30);

        const prevWaMetrics = await this.prisma.webAnalyticsDaily.aggregate({
            where: {
                tenantId,
                date: {
                    gte: prevStartDate,
                    lt: startDate,
                },
            },
            _sum: {
                sessions: true,
                newUsers: true
            },
            _avg: { avgSessionDuration: true }
        });

        const currentSessions = waMetrics._sum.sessions ?? 0;
        const prevSessions = prevWaMetrics._sum.sessions ?? 0;

        const currentNewUsers = waMetrics._sum.newUsers ?? 0;
        const prevNewUsers = prevWaMetrics._sum.newUsers ?? 0;

        // Calculate Trend (with Demo Fallback if no history)
        let sessionsTrend = 0;
        if (prevSessions > 0) {
            sessionsTrend = ((currentSessions - prevSessions) / prevSessions) * 100;
        } else if (currentSessions > 0) {
            // No mock data - use real trend only
            sessionsTrend = 0;
        }

        let newUsersTrend = 0;
        if (prevNewUsers > 0) {
            newUsersTrend = ((currentNewUsers - prevNewUsers) / prevNewUsers) * 100;
        } else if (currentNewUsers > 0) {
            // No mock data - use real trend only
            newUsersTrend = 0;
        }

        // Handle Decimal to Number conversion for avgSessionDuration
        const currentTime = Number(waMetrics._avg.avgSessionDuration ?? 0);
        const prevTime = Number(prevWaMetrics._avg.avgSessionDuration ?? 0);

        let timeTrend = 0;
        if (prevTime > 0) {
            timeTrend = ((currentTime - prevTime) / prevTime) * 100;
        } else if (currentTime > 0) {
            timeTrend = 0; // No mock data - use real trend only
        }

        // Fetch SEO premium metrics aggregations using Raw SQL
        // We calculate the average of avgPosition over the period
        const currentSeoAgg: any[] = await this.prisma.$queryRaw`
            SELECT 
                AVG(CAST(metadata->'seoMetrics'->>'avgPosition' AS DECIMAL)) as avg_position
            FROM web_analytics_daily 
            WHERE tenant_id = ${tenantId}::uuid 
            AND date >= ${startDate} 
            AND date <= ${endDate} 
            AND metadata->'seoMetrics'->>'avgPosition' IS NOT NULL
        `;

        const prevSeoAgg: any[] = await this.prisma.$queryRaw`
            SELECT 
                AVG(CAST(metadata->'seoMetrics'->>'avgPosition' AS DECIMAL)) as avg_position
            FROM web_analytics_daily 
            WHERE tenant_id = ${tenantId}::uuid 
            AND date >= ${prevStartDate} 
            AND date < ${startDate} 
            AND metadata->'seoMetrics'->>'avgPosition' IS NOT NULL
        `;

        // Fetch latest record for other snapshot metrics (Backlinks, DR, UR) which make sense to be "latest"
        const latestSeoData: any[] = await this.prisma.$queryRaw`
            SELECT metadata FROM web_analytics_daily 
            WHERE tenant_id = ${tenantId}::uuid 
            AND metadata IS NOT NULL 
            ORDER BY date DESC 
            LIMIT 1
        `;

        const seoMetrics = latestSeoData[0]?.metadata?.seoMetrics || {};

        const currentAvgPos = Number(currentSeoAgg[0]?.avg_position || 0);
        const prevAvgPos = Number(prevSeoAgg[0]?.avg_position || 0);

        // Calculate Position Trend (Negative is good for rank, but usually UI shows green for improvement)
        // Improvement = Previous - Current (e.g. Rank 10 -> Rank 5 = 5 improvement)
        // Percentage improvement
        let posTrend = 0;
        if (prevAvgPos > 0) {
            // Logic: If rank drops from 20 to 10, it's a 50% improvement (decrease in number)
            // But usually trend UI expects +% for 'up arrow'.
            // For position, 'up' usually means 'better rank' (lower number).
            // Let's stick to standard percentage change: (New - Old) / Old
            // If New(5) - Old(10) = -5. -5/10 = -50%.
            // In the UI, we handle this with `trendUp: (data.avgPositionTrend ?? 0) <= 0` logic usually.
            posTrend = ((currentAvgPos - prevAvgPos) / prevAvgPos) * 100;
        }

        return {
            organicSessions: currentSessions,
            newUsers: currentNewUsers,
            avgTimeOnPage: seoMetrics.avgTimeOnPage || Math.round(currentTime),
            organicSessionsTrend: seoMetrics.organicSessionsTrend || parseFloat(sessionsTrend.toFixed(1)),
            newUsersTrend: parseFloat(newUsersTrend.toFixed(1)),
            // Premium SEO Metrics from database - NO MOCK DATA
            goalCompletions: seoMetrics.goalCompletions || 0,
            goalCompletionsTrend: seoMetrics.goalCompletionsTrend || 0,
            avgPosition: seoMetrics.avgPosition || 0,
            avgPositionTrend: seoMetrics.avgPositionTrend || 0,
            bounceRate: seoMetrics.bounceRate || 0,
            ur: seoMetrics.ur || 0,
            dr: seoMetrics.dr || 0,
            backlinks: seoMetrics.backlinks || 0,
            referringDomains: seoMetrics.referringDomains || 0,
            keywords: seoMetrics.keywords || 0,
            trafficCost: seoMetrics.trafficCost || 0,
            // Add organicPages and crawledPages from database - NO MOCK DATA
            organicPages: seoMetrics.organicPages || 0,
            crawledPages: seoMetrics.crawledPages || 0
        };
    }

    async getSeoHistory(tenantId: string, days: number = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // 1. Fetch Organic Data (WebAnalyticsDaily)
        const organicData = await this.prisma.webAnalyticsDaily.findMany({
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { date: 'asc' },
            select: {
                date: true,
                sessions: true
            }
        });

        // 2. Fetch Ads Data (Metric table - aggregated by date)
        const adsData = await this.prisma.metric.groupBy({
            by: ['date'],
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: {
                clicks: true,
                spend: true,
                impressions: true
            }
        });

        // 3. Fetch SEO metrics from metadata using Raw SQL
        const seoDataResult: any[] = await this.prisma.$queryRaw`
            SELECT date, metadata FROM web_analytics_daily 
            WHERE tenant_id = ${tenantId}::uuid 
            AND date >= ${startDate} 
            AND date <= ${endDate}
            AND metadata IS NOT NULL
        `;

        // Create a map for SEO metrics by date
        const seoMetricsMap = new Map<string, any>();
        seoDataResult.forEach(item => {
            const dateStr = typeof item.date === 'string' ? item.date.split('T')[0] : item.date.toISOString().split('T')[0];
            const seoMetrics = item.metadata?.seoMetrics;
            if (seoMetrics) {
                seoMetricsMap.set(dateStr, seoMetrics);
            }
        });

        // 4. Merge Data
        // Create a map for quick lookup of ads data by date string
        const adsMap = new Map<string, { clicks: number, spend: number, impressions: number }>();
        adsData.forEach(item => {
            const dateStr = item.date.toISOString().split('T')[0];
            adsMap.set(dateStr, {
                clicks: item._sum.clicks ?? 0,
                spend: Number(item._sum.spend ?? 0),
                impressions: item._sum.impressions ?? 0
            });
        });

        // 5. Map organic data and merge with ads data
        // Note: This relies on organicData having entries for days. 
        // If organic data is sparse, we might miss ads-only days. 
        // For distinct complete timeline, we'd generate a date range array, but this is a good start.
        return organicData.map(item => {
            const dateStr = item.date.toISOString().split('T')[0];
            const ads = adsMap.get(dateStr) || { clicks: 0, spend: 0, impressions: 0 };

            // Get SEO metrics for this date from metadata if available
            const seoMetricsForDate = seoMetricsMap.get(dateStr);

            return {
                date: dateStr,
                organicTraffic: item.sessions,
                paidTraffic: ads.clicks,
                paidTrafficCost: ads.spend,
                impressions: ads.impressions,
                // Additional SEO metrics from metadata
                avgPosition: seoMetricsForDate?.avgPosition || 0,
                referringDomains: seoMetricsForDate?.referringDomains || 0,
                dr: seoMetricsForDate?.dr || 0,
                ur: seoMetricsForDate?.ur || 0,
                organicTrafficValue: seoMetricsForDate?.trafficCost || 0,
                organicPages: seoMetricsForDate?.organicPages || 0, // From database - NO MOCK DATA
                crawledPages: seoMetricsForDate?.crawledPages || 0, // From database - NO MOCK DATA
            };
        });
    }

    async getSeoKeywordIntent(tenantId: string) {
        // Current Period (Last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Previous Period (30-60 days ago)
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 30);
        const previousEndDate = new Date(startDate);

        try {


            // 1. Fetch Current Data
            const currentData: any[] = await this.prisma.$queryRaw`
                SELECT type, SUM(keywords) as keywords, SUM(traffic) as traffic
                FROM seo_search_intent
                WHERE tenant_id = ${tenantId}::uuid
                AND date >= ${startDate}
                AND date <= ${endDate}
                GROUP BY type
            `;



            // 2. Fetch Previous Data
            const previousData: any[] = await this.prisma.$queryRaw`
                SELECT type, SUM(keywords) as keywords, SUM(traffic) as traffic
                FROM seo_search_intent
                WHERE tenant_id = ${tenantId}::uuid
                AND date >= ${previousStartDate}
                AND date < ${previousEndDate}
                GROUP BY type
            `;

            // Map previous data for easy lookup
            const prevMap = new Map();
            if (Array.isArray(previousData)) {
                previousData.forEach(item => {
                    prevMap.set(item.type, {
                        keywords: Number(item.keywords || 0),
                        traffic: Number(item.traffic || 0)
                    });
                });
            }

            if (Array.isArray(currentData) && currentData.length > 0) {
                return currentData.map((item: any) => {
                    const prev = prevMap.get(item.type) || { keywords: 0, traffic: 0 };

                    const currentKeywords = Number(item.keywords || 0);
                    const currentTraffic = Number(item.traffic || 0);

                    // Calculate Trends (Delta)
                    const keywordsTrend = currentKeywords - prev.keywords;
                    const trafficTrend = currentTraffic - prev.traffic;

                    return {
                        type: item.type,
                        keywords: currentKeywords,
                        traffic: currentTraffic,
                        keywordsTrend,
                        trafficTrend
                    };
                });
            }

            // If no data, return empty array
            return [];
        } catch (error) {
            console.error('Error fetching SEO keyword intent:', error);
            return [];
        }
    }

    async getSeoTrafficByLocation(tenantId: string) {
        // Calculate date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        try {
            // Fetch location data using Raw SQL
            const locationDataResult: any[] = await this.prisma.$queryRaw`
                SELECT metadata, sessions FROM web_analytics_daily 
                WHERE tenant_id = ${tenantId}::uuid 
                AND date >= ${startDate} 
                AND date <= ${endDate} 
                AND metadata IS NOT NULL
            `;

            if (!locationDataResult || locationDataResult.length === 0) {
                return [];
            }

            // Aggregate traffic by location
            const locationMap = new Map<string, { country: string, city: string, traffic: number, keywords: number, countryCode: string }>();

            locationDataResult.forEach(record => {
                const location = record.metadata?.location;
                if (location) {
                    const key = `${location.country}-${location.city}`;
                    const existing = locationMap.get(key);

                    // Use stored traffic if available, otherwise fallback to sessions (which should be same in this context)
                    const traffic = Number(location.traffic || record.sessions || 0);
                    // Use stored keywords from metadata if available
                    const keywords = Number(location.keywords || 0);

                    if (existing) {
                        existing.traffic += traffic;
                        existing.keywords += keywords;
                    } else {
                        locationMap.set(key, {
                            country: location.country,
                            city: location.city,
                            traffic: traffic,
                            keywords: keywords,
                            countryCode: location.countryCode || this.getCountryCode(location.country)
                        });
                    }
                }
            });

            // Convert to array and sort by traffic (descending)
            return Array.from(locationMap.values())
                .sort((a, b) => b.traffic - a.traffic)
                .slice(0, 10); // Top 10 locations

        } catch (error) {
            console.error('Error fetching SEO traffic by location:', error);
            return [];
        }
    }

    private getCountryCode(countryName: string): string {
        const countryMap: { [key: string]: string } = {
            'Thailand': 'TH',
            'United States': 'US',
            'United Kingdom': 'GB',
            'Singapore': 'SG',
            'Japan': 'JP',
            'Malaysia': 'MY',
            'Australia': 'AU'
        };
        return countryMap[countryName] || 'XX';
    }

}
