import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class SeoService {
    constructor(private readonly prisma: PrismaService) { }

    async getSeoSummary(tenantId: string) {
        try {
            // Get latest 30 days of data from all related tables
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            // 1. Get web analytics data
            const webAnalyticsData = await this.prisma.webAnalyticsDaily.findMany({
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: { date: 'asc' }
            });

            // 2. Get SEO offpage metrics
            const offpageData = await this.prisma.seoOffpageMetricSnapshots.findMany({
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: { date: 'asc' }
            });

            // 3. Get SEO top keywords
            const keywordsData = await this.prisma.seoTopKeywords.findMany({
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: { position: 'asc' },
                take: 10
            });

            // 4. Get SEO traffic by location
            const locationData = await this.prisma.seoTrafficByLocation.findMany({
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: { traffic: 'desc' },
                take: 10
            });

            // 5. Get SEO search intent
            const intentData = await this.prisma.seoSearchIntent.findMany({
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: { traffic: 'desc' }
            });

            // 6. Get SEO anchor text
            const anchorData = await this.prisma.seoAnchorText.findMany({
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: { referringDomains: 'desc' },
                take: 10
            });

            // 7. Get metrics data (paid traffic)
            const metricsData = await this.prisma.metric.findMany({
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: { date: 'asc' }
            });

            // Calculate totals from web analytics (sum of 30 days)
            const totalOrganicSessions = webAnalyticsData.reduce((sum, day) => sum + day.sessions, 0);
            const totalNewUsers = webAnalyticsData.reduce((sum, day) => sum + day.newUsers, 0);
            const avgSessionDuration = webAnalyticsData.length > 0 ? 
                Number(webAnalyticsData.reduce((sum, day) => sum + Number(day.avgSessionDuration), 0)) / webAnalyticsData.length : 65;

            // Use the latest offpage snapshot for summary cards (these are point-in-time metrics)
            const latestOffpage = offpageData[offpageData.length - 1];
            const avgUR = parseFloat((latestOffpage?.ur || 21.3).toFixed(2));
            const avgDR = parseFloat((latestOffpage?.dr || 34.3).toFixed(2));
            
            const backlinks = latestOffpage?.backlinks ?? 0;
            const referringDomains = latestOffpage?.referringDomains ?? 0;
            const keywords = latestOffpage?.keywords ?? 0;
            const trafficCost = latestOffpage?.trafficCost ?? 0;

            // Use latest organicTraffic as a proxy for pages (until dedicated fields exist)
            const organicPages = latestOffpage?.organicTraffic ?? 0;
            const crawledPages = latestOffpage?.organicTraffic ?? 0;

            // Calculate totals from metrics (sum of 30 days)
            const totalPaidTraffic = metricsData.reduce((sum, day) => sum + day.clicks, 0);
            const totalImpressions = metricsData.reduce((sum, day) => sum + day.impressions, 0);
            const totalSpend = Number(metricsData.reduce((sum, day) => sum + Number(day.spend), 0));

            // Calculate goal completions (4.5% of organic sessions)
            const goalCompletions = Math.round(totalOrganicSessions * 0.045);

            // Calculate average position from keywords (average of all keywords in 30 days)
            const avgPosition = keywordsData.length > 0 ? 
                keywordsData.reduce((sum, kw) => sum + kw.position, 0) / keywordsData.length : 10.8;

            // Calculate trends (using latest vs previous data)
            const latestWebAnalytics = webAnalyticsData[webAnalyticsData.length - 1];
            const previousWebAnalytics = webAnalyticsData.length > 1 ? webAnalyticsData[webAnalyticsData.length - 2] : null;
            
            const organicSessionsTrend = previousWebAnalytics && previousWebAnalytics.sessions > 0 ? 
                ((latestWebAnalytics.sessions - previousWebAnalytics.sessions) / previousWebAnalytics.sessions) * 100 : 20.2;

            const avgPositionTrend = -46.3; // Mock trend for now

            return {
                organicSessions: totalOrganicSessions,
                newUsers: totalNewUsers,
                avgTimeOnPage: Math.round(avgSessionDuration) || 65,
                organicSessionsTrend: parseFloat(organicSessionsTrend.toFixed(1)),
                newUsersTrend: parseFloat(organicSessionsTrend.toFixed(1)),
                goalCompletions: goalCompletions,
                goalCompletionsTrend: 0,
                avgPosition: parseFloat(avgPosition.toFixed(1)),
                avgPositionTrend: avgPositionTrend,
                bounceRate: latestWebAnalytics?.bounceRate || 0,
                ur: avgUR,
                dr: avgDR,
                backlinks: backlinks,
                referringDomains: referringDomains,
                keywords: keywords,
                trafficCost: trafficCost,
                paidTraffic: totalPaidTraffic,
                paidTrafficTrend: 0,
                impressions: totalImpressions,
                impressionsTrend: 0,
                organicPages: organicPages,
                crawledPages: crawledPages
            };
        } catch (error) {
            console.error('Error fetching SEO summary:', error);
            // Return default values on error
            return {
                organicSessions: 0,
                newUsers: 0,
                avgTimeOnPage: 0,
                organicSessionsTrend: 0,
                newUsersTrend: 0,
                goalCompletions: 0,
                goalCompletionsTrend: 0,
                avgPosition: 0,
                avgPositionTrend: 0,
                bounceRate: 0,
                ur: 0,
                dr: 0,
                backlinks: 0,
                referringDomains: 0,
                keywords: 0,
                trafficCost: 0,
                paidTraffic: 0,
                paidTrafficTrend: 0,
                impressions: 0,
                impressionsTrend: 0,
                organicPages: 0,
                crawledPages: 0
            };
        }
    }

    async getSeoHistory(tenantId: string, days: number = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // 1. Fetch Organic Data (WebAnalyticsDaily) - aggregate for 30 days
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

        // 3. Fetch SEO Offpage Data (direct from table)
        const offpageData = await this.prisma.seoOffpageMetricSnapshots.findMany({
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { date: 'asc' }
        });

        // 3.1 Fetch SEO Top Keywords for avgPosition calculation
        const keywordsDataForHistory = await this.prisma.seoTopKeywords.findMany({
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { date: 'asc' }
        });

        // Create a map for quick lookup of offpage data by date string
        const offpageMap = new Map<string, any>();
        offpageData.forEach(item => {
            const dateStr = item.date.toISOString().split('T')[0];
            offpageMap.set(dateStr, {
                backlinks: item.backlinks,
                referringDomains: item.referringDomains,
                keywords: item.keywords,
                trafficCost: item.trafficCost,
                avgPosition: 0, // Will be calculated from keywords table
                dr: item.dr,
                ur: item.ur,
                organicPages: item.organicTraffic,
                crawledPages: item.organicTraffic,
                organicTrafficValue: item.organicTrafficValue
            });
        });

        // Create a map for average position by date
        const avgPositionMap = new Map<string, number>();
        const keywordsByDate = new Map<string, any[]>();
        
        keywordsDataForHistory.forEach(item => {
            const dateStr = item.date.toISOString().split('T')[0];
            if (!keywordsByDate.has(dateStr)) {
                keywordsByDate.set(dateStr, []);
            }
            keywordsByDate.get(dateStr)!.push(item);
        });

        // Calculate average position for each date
        keywordsByDate.forEach((keywords, dateStr) => {
            if (keywords.length > 0) {
                const avgPos = keywords.reduce((sum, kw) => sum + kw.position, 0) / keywords.length;
                avgPositionMap.set(dateStr, avgPos);
            }
        });

        // 4. Merge Data and Calculate Daily Maximum Values
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

        // Calculate daily maximum values for last 30 days
        const historyData = organicData.map((item, index) => {
            const dateStr = item.date.toISOString().split('T')[0];
            const ads = adsMap.get(dateStr) || { clicks: 0, spend: 0, impressions: 0 };

            // Get SEO metrics for this date from offpage data if available
            const offpageMetricsForDate = offpageMap.get(dateStr);
            const avgPositionForDate = avgPositionMap.get(dateStr) || 0;

            return {
                date: dateStr,
                organicTraffic: item.sessions,
                paidTraffic: ads.clicks,
                paidTrafficCost: ads.spend,
                impressions: ads.impressions,
                // Daily maximum values (not cumulative)
                backlinks: offpageMetricsForDate?.backlinks || 0,
                referringDomains: offpageMetricsForDate?.referringDomains || 0,
                keywords: offpageMetricsForDate?.keywords || 0,
                trafficCost: offpageMetricsForDate?.trafficCost || 0,
                // Additional SEO metrics from offpage data
                avgPosition: avgPositionForDate,
                dr: offpageMetricsForDate?.dr || 0,
                ur: offpageMetricsForDate?.ur || 0,
                organicPages: offpageMetricsForDate?.organicPages || 0,
                crawledPages: offpageMetricsForDate?.crawledPages || 0,
                organicTrafficValue: offpageMetricsForDate?.organicTrafficValue || 0
            };
        });

        // Return data for 30 days (oldest to newest)
        return historyData;
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

    async getTopKeywords(tenantId: string) {
        try {
            // Fetch top keywords from SeoTopKeywords table
            const keywords = await this.prisma.seoTopKeywords.findMany({
                where: {
                    tenantId
                },
                orderBy: {
                    traffic: 'desc'
                },
                take: 10,
                select: {
                    keyword: true,
                    position: true,
                    volume: true,
                    traffic: true
                }
            });

            // Calculate traffic percentage for each keyword
            const totalTraffic = keywords.reduce((sum, kw) => sum + kw.traffic, 0);
            
            return keywords.map(kw => ({
                keyword: kw.keyword,
                position: kw.position,
                volume: kw.volume,
                trafficPercent: totalTraffic > 0 ? Math.round((kw.traffic / totalTraffic) * 100 * 10) / 10 : 0
            }));
        } catch (error) {
            console.error('Error fetching top keywords:', error);
            return [];
        }
    }

    async getOffpageSnapshots(tenantId: string) {
        try {
            // Fetch offpage snapshots from SeoOffpageMetricSnapshots table
            const snapshots = await this.prisma.seoOffpageMetricSnapshots.findMany({
                where: {
                    tenantId
                },
                orderBy: {
                    date: 'asc'
                },
                select: {
                    date: true,
                    backlinks: true,
                    referringDomains: true,
                    ur: true,
                    dr: true,
                    organicTrafficValue: true
                }
            });

            return snapshots.map(snapshot => ({
                date: snapshot.date.toISOString().split('T')[0],
                backlinks: snapshot.backlinks,
                referringDomains: snapshot.referringDomains,
                ur: snapshot.ur,
                dr: snapshot.dr,
                organicTrafficValue: snapshot.organicTrafficValue
            }));
        } catch (error) {
            console.error('Error fetching offpage snapshots:', error);
            return [];
        }
    }

    async getAnchorTexts(tenantId: string) {
        try {
            // Fetch anchor texts from SeoAnchorText table
            const anchorTexts = await this.prisma.seoAnchorText.findMany({
                where: {
                    tenantId
                },
                orderBy: {
                    referringDomains: 'desc'
                },
                select: {
                    anchorText: true,
                    referringDomains: true,
                    totalBacklinks: true,
                    dofollowBacklinks: true,
                    traffic: true,
                    trafficPercentage: true
                }
            });

            return anchorTexts.map(anchor => ({
                text: anchor.anchorText,
                referringDomains: anchor.referringDomains,
                totalBacklinks: anchor.totalBacklinks,
                dofollowBacklinks: anchor.dofollowBacklinks,
                traffic: anchor.traffic,
                trafficPercentage: anchor.trafficPercentage
            }));
        } catch (error) {
            console.error('Error fetching anchor texts:', error);
            return [];
        }
    }

    async getAiInsights(tenantId: string) {
        try {
            // Fetch AI insights from AiInsight table
            const insights = await this.prisma.aiInsight.findMany({
                where: {
                    tenantId
                },
                orderBy: {
                    occurredAt: 'desc'
                },
                select: {
                    id: true,
                    type: true,
                    source: true,
                    title: true,
                    message: true,
                    payload: true,
                    status: true,
                    occurredAt: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            return insights.map(insight => ({
                id: insight.id,
                type: insight.type,
                source: insight.source,
                title: insight.title,
                message: insight.message,
                payload: insight.payload,
                status: insight.status,
                occurredAt: insight.occurredAt.toISOString(),
                createdAt: insight.createdAt.toISOString(),
                updatedAt: insight.updatedAt.toISOString()
            }));
        } catch (error) {
            console.error('Error fetching AI insights:', error);
            return [];
        }
    }

}
