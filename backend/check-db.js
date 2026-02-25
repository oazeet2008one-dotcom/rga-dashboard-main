const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
    const p = new PrismaClient();
    let output = '';
    const log = (msg) => { output += msg + '\n'; };

    try {
        log('=== DATABASE STATUS REPORT ===');
        log('Date: ' + new Date().toISOString());
        log('');

        // Tenants
        const tenantList = await p.$queryRawUnsafe('SELECT id, name, slug, subscription_plan, subscription_status FROM tenants');
        log('📦 TENANTS (' + tenantList.length + '):');
        tenantList.forEach(t => log('  - ' + t.name + ' | slug: ' + t.slug + ' | plan: ' + t.subscription_plan));

        // Users
        const userList = await p.$queryRawUnsafe("SELECT id, email, role, email_verified, is_active, tenant_id FROM users");
        log('\n👤 USERS (' + userList.length + '):');
        userList.forEach(u => log('  - ' + u.email + ' | role: ' + u.role + ' | verified: ' + u.email_verified + ' | active: ' + u.is_active + ' | tenant: ' + u.tenant_id));

        // Campaigns
        const campaignList = await p.$queryRawUnsafe("SELECT name, platform, status, currency FROM campaigns LIMIT 15");
        log('\n📊 CAMPAIGNS (' + campaignList.length + '):');
        campaignList.forEach(c => log('  - ' + c.name + ' | ' + c.platform + ' | ' + c.status + ' | ' + c.currency));

        // Metrics
        const metrics = await p.$queryRawUnsafe('SELECT count(*)::int as cnt FROM metrics');
        log('\n📈 Metrics rows: ' + metrics[0].cnt);

        // Integrations
        const intList = await p.$queryRawUnsafe("SELECT id, name, type, status, is_active FROM integrations");
        log('\n🔗 INTEGRATIONS (' + intList.length + '):');
        intList.forEach(i => log('  - ' + i.name + ' | type: ' + i.type + ' | status: ' + i.status + ' | active: ' + i.is_active));

        // Web Analytics
        const wa = await p.$queryRawUnsafe('SELECT count(*)::int as cnt FROM web_analytics_daily');
        log('\n🌐 Web Analytics Daily rows: ' + wa[0].cnt);

        // SEO data
        const seoOffpage = await p.$queryRawUnsafe('SELECT count(*)::int as cnt FROM seo_offpage_metric_snapshots');
        log('📎 SEO Offpage Snapshots: ' + seoOffpage[0].cnt);

        const seoKeywords = await p.$queryRawUnsafe('SELECT count(*)::int as cnt FROM seo_top_keywords');
        log('🔑 SEO Top Keywords: ' + seoKeywords[0].cnt);

        const seoIntent = await p.$queryRawUnsafe('SELECT count(*)::int as cnt FROM seo_search_intent');
        log('🔍 SEO Search Intent: ' + seoIntent[0].cnt);

        const seoAnchor = await p.$queryRawUnsafe('SELECT count(*)::int as cnt FROM seo_anchor_text');
        log('⚓ SEO Anchor Text: ' + seoAnchor[0].cnt);

        const seoLocation = await p.$queryRawUnsafe('SELECT count(*)::int as cnt FROM seo_traffic_by_location');
        log('📍 SEO Traffic by Location: ' + seoLocation[0].cnt);

        // Alerts, Notifications
        const alerts = await p.$queryRawUnsafe('SELECT count(*)::int as cnt FROM alerts');
        log('\n🚨 Alerts: ' + alerts[0].cnt);

        const notifs = await p.$queryRawUnsafe('SELECT count(*)::int as cnt FROM notifications');
        log('🔔 Notifications: ' + notifs[0].cnt);

        const auditLogs = await p.$queryRawUnsafe('SELECT count(*)::int as cnt FROM audit_logs');
        log('📝 Audit Logs: ' + auditLogs[0].cnt);

        // Sessions
        const sessions = await p.$queryRawUnsafe('SELECT count(*)::int as cnt FROM sessions');
        log('🔐 Sessions: ' + sessions[0].cnt);

        log('\n✅ Database connection verified and healthy!');
    } catch (e) {
        log('❌ Database Error: ' + e.message);
    } finally {
        await p.$disconnect();
    }

    fs.writeFileSync('db-report.txt', output);
    console.log(output);
}

main();
