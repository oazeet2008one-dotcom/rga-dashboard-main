import { TutorialStep } from '@/stores/tutorial-store';

export const TUTORIAL_steps: Record<string, TutorialStep[]> = {
    overview: [
        {
            targetId: 'tutorial-overview-header',
            title: 'Welcome to Your Command Center',
            content: 'This dashboard aggregates real-time data from all your connected ad platforms (Google, Facebook, TikTok, etc.) to provide a single, unified view of your marketing performance.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-checklist',
            title: 'System Health & Integration',
            content: 'Ensure your data pipeline is healthy. This active checklist monitors your ad account connections and pixel status to guarantee 100% data accuracy.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-overview-kpi',
            title: 'North-Star Metrics',
            content: 'Monitor your core campaign performance. We track Total Spend, Impressions, Clicks, and Conversions vs previous period to gauge immediate traction.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-overview-ai-summary',
            title: 'AI Strategic Intelligence',
            content: 'Leverage machine learning to analyze your data. This section provides daily executive summaries, identifies anomalies, and offers actionable budget recommendations based on performance trends.',
            position: 'top'
        },
        {
            targetId: 'tutorial-overview-trend-chart',
            title: 'Growth Trajectory Analysis',
            content: 'Visualize performance over time. Toggle between Spend, Revenue, and Conversions to spot seasonal trends, monitor budget efficiency, and correlate spikes with specific campaigns.',
            position: 'inner-right'
        },
        {
            targetId: 'tutorial-overview-recent-campaigns',
            title: 'Live Campaign Feed',
            content: 'Keep a pulse on your active ads. This real-time feed ranks your top campaigns by performance, allowing you to quickly identify winners to scale or underperformers to fix.',
            position: 'inner-top-left'
        },
        {
            targetId: 'tutorial-overview-financial',
            title: 'Profitability Analysis',
            content: 'Go beyond just "Ad Spend". This breakdown calculates your Estimated Gross Profit by subtracting ad costs from revenue, giving you the true bottom-line impact of your marketing.',
            position: 'inner-top-right'
        },
        {
            targetId: 'tutorial-overview-funnel',
            title: 'Full-Funnel Conversion View',
            content: 'Diagnose your customer journey. We visualize conversion rates at every stage—from Impression to Click to Purchase—helping you pinpoint exactly where you are losing potential customers.',
            position: 'inner-top-left'
        }
    ],
    campaigns: [
        {
            targetId: 'tutorial-campaigns-header',
            title: 'Campaign Command Center',
            content: 'Centralized control for all your advertising efforts. Create new campaigns, export reports, and manage your cross-platform strategy from this single view.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-campaigns-search',
            title: 'Precision Search',
            content: 'Quickly locate specific campaigns by name. Supporting fuzzy search, this tool helps you find exactly what you need in seconds, even with hundreds of active ads.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-campaigns-status-filter',
            title: 'Status Filters',
            content: 'Isolate specific campaign lifecycles. Toggle between Active, Paused, or Completed campaigns to focus your optimization efforts where they matter most.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-campaigns-selected-only',
            title: 'Focus Mode',
            content: 'Eliminate noise. Select specific campaigns using the checkboxes in the table, then click this button to instantly filter the view to show ONLY your selection.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-campaigns-date-filter',
            title: 'Time Travel',
            content: 'Adjust your analytical window. Switch between Last 7 Days, Last Month, or Custom Ranges to spot historical trends or recent anomalies.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-campaigns-columns-button',
            title: 'Customizable Metrics Grid',
            content: 'Select additional metrics to customize the view exactly as you need.',
            position: 'left'
        },
        {
            targetId: 'tutorial-campaigns-list',
            title: 'Actionable Insights Row',
            content: 'Each row is a campaign. Use the checkboxes for bulk actions, or click the campaign name to dive into a granular day-by-day performance report.',
            position: 'inner-bottom-right'
        },
        {
            targetId: 'tutorial-campaigns-summary',
            title: 'Performance Pulse',
            content: 'Aggregated health metrics for your current selection. Instantly see the Total Cost, Impressions, and Clicks for filtered campaigns without manual calculation.',
            position: 'top'
        },
        {
            targetId: 'tutorial-campaigns-visualization-chart',
            title: 'Trend Visualization',
            content: 'Visualize budget efficiency. This chart compares Spend against Revenue and Budget across your top campaigns, instantly revealing which ads are profitable.',
            position: 'right'
        },
        {
            targetId: 'tutorial-campaigns-visualization-highlights',
            title: 'Key Performance Drivers',
            content: 'At-a-glance leadership board. Quickly see your Top ROI campaign, Best Performer, and total Active Count in this condensed executive summary.',
            position: 'left'
        },
        {
            targetId: 'tutorial-campaigns-conversion-rate',
            title: 'Conversion Intelligence',
            content: 'The ultimate success metric. This card benchmarks your Conversion Rate against your account average, telling you instantly if a campaign is a "Winner" or "Underperformer".',
            position: 'right'
        },
        {
            targetId: 'tutorial-campaigns-platform-breakdown',
            title: 'Cross-Platform ROI',
            content: 'See where your budget works hardest. This breakdown compares efficiency across Facebook, Google, Line, and TikTok, helping you reallocate funds to the highest-performing channels.',
            position: 'left'
        }
    ],
    ai_insights: [
        {
            targetId: 'tutorial-ai-detail-summary-card',
            title: 'AI Detail Summary',
            content: 'Deep dive analysis & strategic reports',
            position: 'right'
        },
        {
            targetId: 'tutorial-ai-marketing-tools',
            title: 'Marketing Calculators',
            content: 'Quick actions for ads & content',
            position: 'left'
        },
        {
            targetId: 'tutorial-ai-chat-input',
            title: 'Ask AI Anything',
            content: 'Type questions or use voice commands',
            position: 'top'
        },
        {
            targetId: 'tutorial-ai-new-chat',
            title: 'Start Fresh',
            content: 'Click to begin a new conversation',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-ai-summary-history',
            title: 'Chat History',
            content: 'Access past conversations',
            position: 'left'
        }
    ],
    data_sources: [
        {
            targetId: 'tutorial-datasources-header',
            title: 'Connect Your World',
            content: 'This is where you plug in your ad accounts. Think of it as plugging a lamp into a socket—once connected, the light (data) flows automatically.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-datasource-card-google',
            title: 'Ad Platforms',
            content: 'These are the services you use for advertising, like Google or Facebook. You can see which ones are ready to connect here.',
            position: 'right'
        },
        {
            targetId: 'tutorial-datasource-connect-btn-google',
            title: 'One-Click Sync',
            content: 'Just click "Connect" and log in with your account. We will handle the heavy lifting to pull your data in safely.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-datasources-help',
            title: 'Safe & Secure',
            content: 'Your privacy is our priority. We only read the data needed to show your reports details.',
            position: 'top'
        }
    ],
    seo: [
        {
            targetId: 'tutorial-seo-header',
            title: 'Search Command Center',
            content: 'Master your organic presence. This dashboard tracks your rankings, traffic quality, and backlink authority in one place.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-seo-overview',
            title: 'Quick Vitals',
            content: 'Immediate health check. Monitor your total organic sessions, goal completions, and average time on page at a glance.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-seo-premium',
            title: 'Authority Score',
            content: 'Your reputation power. We track Domain Rating (DR) and URL Rating (UR) to show how authoritative search engines consider your site.',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-seo-chart',
            title: 'Traffic Trends',
            content: 'Visualize your growth. Compare organic traffic against goal completions over time to prove the ROI of your SEO efforts.',
            position: 'top'
        },
        {
            targetId: 'tutorial-seo-keywords',
            title: 'Winning Keywords',
            content: 'See what drives traffic. This table ranks your top performing keywords by volume and position, highlighting your biggest opportunities.',
            position: 'left'
        },
        {
            targetId: 'tutorial-seo-location',
            title: 'Global Reach',
            content: 'Where are your visitors? Pinpoint your top performing countries and cities to tailor your content strategy.',
            position: 'left'
        },
        {
            targetId: 'tutorial-seo-intent',
            title: 'User Mindset',
            content: 'Decode user intent. Are visitors looking for information (Informational) or ready to buy (Transactional)? Use this to guide your content creation.',
            position: 'left'
        },
        {
            targetId: 'tutorial-seo-anchor',
            title: 'Link Profile',
            content: 'Analyze your backlinks. See the most common text used to link to your site, ensuring a natural and healthy profile.',
            position: 'left'
        },
        {
            targetId: 'tutorial-seo-offpage',
            title: 'Backlink Health',
            content: 'The backbone of SEO. Track your total backlinks and referring domains to ensure your off-page strategy is building momentum.',
            position: 'top'
        }
    ]
};
