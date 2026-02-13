import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAllSeoData() {
    try {
        // Prefer the tenantId of the admin user (matches the dashboard tenant)
        const adminUser = await prisma.user.findFirst({ where: { email: 'admin@rga.com' } });
        const tenant = adminUser?.tenantId
            ? await prisma.tenant.findUnique({ where: { id: adminUser.tenantId } })
            : await prisma.tenant.findFirst();
        if (!tenant) {
            console.error('No tenant found!');
            return;
        }

        const tenantId = tenant.id;
        console.log('Using tenant ID:', tenantId);

        // 1. Seed Web Analytics Daily (30 days)
        console.log('Seeding Web Analytics Daily...');
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Check if record exists
            const existing = await prisma.webAnalyticsDaily.findFirst({
                where: {
                    tenantId: tenantId,
                    propertyId: 'GA4_PROPERTY_123',
                    date: date
                }
            });

            if (!existing) {
                await prisma.webAnalyticsDaily.create({
                    data: {
                        tenantId: tenantId,
                        propertyId: 'GA4_PROPERTY_123',
                        date: date,
                        sessions: Math.floor(8000 + Math.random() * 4000),
                        newUsers: Math.floor(2000 + Math.random() * 2000),
                        avgSessionDuration: Math.floor(120 + Math.random() * 120),
                        bounceRate: Math.random() * 0.6
                    }
                });
            }
        }

        // 2. Seed SEO Offpage Metric Snapshots
        console.log('Seeding SEO Offpage Metric Snapshots...');
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Check if record exists
            const existing = await prisma.seoOffpageMetricSnapshots.findFirst({
                where: {
                    tenantId: tenantId,
                    date: date
                }
            });

            if (!existing) {
                await prisma.seoOffpageMetricSnapshots.create({
                    data: {
                        tenantId: tenantId,
                        date: date,
                        ur: 21.3 + Math.random() * 5,
                        dr: 34.3 + Math.random() * 10,
                        backlinks: 500 + Math.floor(Math.random() * 200),
                        referringDomains: 200 + Math.floor(Math.random() * 100),
                        keywords: 1000 + Math.floor(Math.random() * 500),
                        trafficCost: 200000 + Math.floor(Math.random() * 100000),
                        organicTraffic: 8000 + Math.floor(Math.random() * 4000),
                        organicTrafficValue: 200000 + Math.floor(Math.random() * 100000),
                        newReferringDomains: Math.floor(Math.random() * 10),
                        newBacklinks: Math.floor(Math.random() * 20),
                        lostReferringDomains: Math.floor(Math.random() * 5),
                        lostBacklinks: Math.floor(Math.random() * 10)
                    }
                });
            }
        }

        // 3. Seed SEO Top Keywords
        console.log('Seeding SEO Top Keywords...');
        const keywords = [
            'social media marketing', 'digital marketing', 'seo services', 'content marketing',
            'web development', 'online advertising', 'email marketing', 'brand strategy',
            'marketing automation', 'lead generation'
        ];

        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            for (let j = 0; j < keywords.length; j++) {
                const existing = await prisma.seoTopKeywords.findFirst({
                    where: {
                        tenantId: tenantId,
                        date: date,
                        keyword: keywords[j]
                    }
                });

                if (!existing) {
                    const position = Math.floor(Math.random() * 50) + 1;
                    const volume = Math.floor(Math.random() * 10000) + 100;
                    const traffic = Math.floor(Math.random() * 1000) + 10;
                    const trafficPercentage = Math.random() * 100;
                    const url = `https://example.com/page/${i}`;
                    const change = Math.floor(Math.random() * 20) - 10;

                    try {
                        await prisma.seoTopKeywords.create({
                            data: {
                                tenantId: tenantId,
                                date: date,
                                keyword: keywords[j],
                                position,
                                volume,
                                traffic,
                                trafficPercentage,
                                url,
                                change
                            }
                        });
                    } catch (e: any) {
                        // Some DB environments still have a NOT NULL `cpc` column even though Prisma schema doesn't.
                        // Insert via raw SQL with a generated CPC in that case.
                        const cpc = Number((0.5 + Math.random() * 2).toFixed(2));
                        await prisma.$executeRawUnsafe(
                            `INSERT INTO seo_top_keywords (tenant_id, date, keyword, position, volume, traffic, traffic_percentage, url, change, cpc, created_at, updated_at)
                             VALUES ($1::uuid, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
                            tenantId,
                            date,
                            keywords[j],
                            position,
                            volume,
                            traffic,
                            trafficPercentage,
                            url,
                            change,
                            cpc
                        );
                    }
                }
            }
        }

        // 4. Seed SEO Traffic by Location
        console.log('Seeding SEO Traffic by Location...');
        const locations = [
            'Thailand-Phuket', 'United States-New York', 'United States-Los Angeles',
            'United Kingdom-London', 'Singapore-Singapore', 'Japan-Tokyo',
            'Malaysia-Kuala Lumpur', 'Australia-Sydney', 'Germany-Berlin', 'France-Paris'
        ];

        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            for (let j = 0; j < locations.length; j++) {
                const existing = await prisma.seoTrafficByLocation.findFirst({
                    where: {
                        tenantId: tenantId,
                        date: date,
                        location: locations[j]
                    }
                });

                if (!existing) {
                    await prisma.seoTrafficByLocation.create({
                        data: {
                            tenantId: tenantId,
                            date: date,
                            location: locations[j],
                            traffic: Math.floor(100 + Math.random() * 1000),
                            trafficPercentage: 1 + Math.random() * 20,
                            keywords: Math.floor(50 + Math.random() * 500)
                        }
                    });
                }
            }
        }

        // 5. Seed SEO Search Intent
        console.log('Seeding SEO Search Intent...');
        const intents = [
            { type: 'Branded', keywords: 718, traffic: 14400 },
            { type: 'Non-branded', keywords: 3000, traffic: 21500 },
            { type: 'Informational', keywords: 1800, traffic: 18300 },
            { type: 'Navigational', keywords: 355, traffic: 3600 },
            { type: 'Commercial', keywords: 1100, traffic: 12500 },
            { type: 'Transactional', keywords: 342, traffic: 1800 }
        ];

        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            for (const intent of intents) {
                const existing = await prisma.seoSearchIntent.findFirst({
                    where: {
                        tenantId: tenantId,
                        date: date,
                        type: intent.type
                    }
                });

                if (!existing) {
                    await prisma.seoSearchIntent.create({
                        data: {
                            tenantId: tenantId,
                            date: date,
                            type: intent.type,
                            keywords: intent.keywords + Math.floor(Math.random() * 100),
                            traffic: intent.traffic + Math.floor(Math.random() * 1000)
                        }
                    });
                }
            }
        }

        // 6. Seed SEO Anchor Text
        console.log('Seeding SEO Anchor Text...');
        const anchors = [
            'click here', 'learn more', 'read more', 'view details', 'shop now',
            'buy now', 'get started', 'contact us', 'about us', 'services'
        ];

        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            for (let j = 0; j < anchors.length; j++) {
                const existing = await prisma.seoAnchorText.findFirst({
                    where: {
                        tenantId: tenantId,
                        date: date,
                        anchorText: anchors[j]
                    }
                });

                if (!existing) {
                    await prisma.seoAnchorText.create({
                        data: {
                            tenantId: tenantId,
                            date: date,
                            anchorText: anchors[j],
                            domains: Math.floor(10 + Math.random() * 50),
                            totalBacklinks: Math.floor(20 + Math.random() * 100),
                            dofollowBacklinks: Math.floor(15 + Math.random() * 80),
                            referringDomains: Math.floor(5 + Math.random() * 45),
                            traffic: Math.floor(100 + Math.random() * 1000),
                            trafficPercentage: 1 + Math.random() * 15
                        }
                    });
                }
            }
        }

        // 7. Seed Metrics (Paid Traffic)
        console.log('Seeding Metrics...');
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            const existing = await prisma.metric.findFirst({
                where: {
                    tenantId: tenantId,
                    date: date
                }
            });

            if (!existing) {
                // Get a campaign ID
                const campaign = await prisma.campaign.findFirst({
                    where: { tenantId: tenantId }
                });

                if (campaign) {
                    await prisma.metric.create({
                        data: {
                            tenantId: tenantId,
                            campaignId: campaign.id,
                            date: date,
                            platform: 'GOOGLE_ADS',
                            impressions: Math.floor(10000 + Math.random() * 50000),
                            clicks: Math.floor(100 + Math.random() * 1000),
                            spend: Math.floor(1000 + Math.random() * 10000),
                            conversions: Math.floor(10 + Math.random() * 100),
                            costPerClick: Math.floor(1 + Math.random() * 5),
                            costPerMille: Math.floor(5 + Math.random() * 20),
                            costPerAction: Math.floor(10 + Math.random() * 100),
                            ctr: Math.random() * 0.1,
                            conversionRate: Math.random() * 0.1,
                            roas: Math.random() * 5,
                            revenue: Math.floor(5000 + Math.random() * 50000),
                            orders: Math.floor(10 + Math.random() * 200),
                            averageOrderValue: Math.floor(50 + Math.random() * 500),
                            cartAbandonmentRate: Math.random() * 0.5,
                            organicTraffic: Math.floor(1000 + Math.random() * 10000),
                            bounceRate: Math.random() * 0.8,
                            avgSessionDuration: Math.floor(30 + Math.random() * 180)
                        }
                    });
                }
            }
        }

        console.log('All SEO data seeded successfully!');
    } catch (error) {
        console.error('Error seeding SEO data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAllSeoData();
