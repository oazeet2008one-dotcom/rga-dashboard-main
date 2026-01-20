// Campaign Details Page
// Shows campaign with tabs for Overview, Ad Groups, and Settings

import { Link, useParams } from 'wouter';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCampaign } from '../hooks/use-campaigns';
import { AdGroupsTabContent } from '@/features/ad-groups';

// =============================================================================
// Status Badge Styling
// =============================================================================
const statusStyles: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    active: { variant: 'default', label: 'Active' },
    paused: { variant: 'secondary', label: 'Paused' },
    draft: { variant: 'outline', label: 'Draft' },
    completed: { variant: 'secondary', label: 'Completed' },
};

// =============================================================================
// Loading Skeleton
// =============================================================================
function CampaignDetailsSkeleton() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Breadcrumb skeleton */}
                <Skeleton className="h-5 w-48" />

                {/* Header skeleton */}
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                </div>

                {/* Tabs skeleton */}
                <Skeleton className="h-10 w-80" />

                {/* Content skeleton */}
                <Skeleton className="h-64 w-full" />
            </div>
        </DashboardLayout>
    );
}

// =============================================================================
// Error State
// =============================================================================
function CampaignNotFound() {
    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Campaign Not Found</h2>
                    <p className="text-muted-foreground mt-2">
                        The campaign you're looking for doesn't exist or has been deleted.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/campaigns">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Campaigns
                    </Link>
                </Button>
            </div>
        </DashboardLayout>
    );
}

// =============================================================================
// Main Component
// =============================================================================
export function CampaignDetailsPage() {
    // Get campaignId from route params (wouter style)
    const params = useParams<{ campaignId: string }>();
    const campaignId = params.campaignId || '';

    // Fetch campaign data
    const { data: campaign, isLoading, error } = useCampaign(campaignId);

    // Loading state
    if (isLoading) {
        return <CampaignDetailsSkeleton />;
    }

    // Error or not found state
    if (error || !campaign) {
        return <CampaignNotFound />;
    }

    const status = statusStyles[campaign.status] || statusStyles.draft;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Breadcrumb */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/campaigns">Campaigns</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{campaign.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/campaigns">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{campaign.name}</h1>
                                <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Platform: {campaign.platform} • Budget: ฿{campaign.budget?.toLocaleString() ?? 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="ad-groups">Ad Groups</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Campaign Performance Overview</CardTitle>
                                <CardDescription>
                                    View key metrics and performance data for this campaign
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Impressions</p>
                                        <p className="text-2xl font-bold">{campaign.impressions?.toLocaleString() ?? 0}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Clicks</p>
                                        <p className="text-2xl font-bold">{campaign.clicks?.toLocaleString() ?? 0}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Spent</p>
                                        <p className="text-2xl font-bold">฿{campaign.spent?.toLocaleString() ?? 0}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">CTR</p>
                                        <p className="text-2xl font-bold">
                                            {campaign.impressions && campaign.clicks
                                                ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
                                                : '0.00'}%
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Ad Groups Tab */}
                    <TabsContent value="ad-groups" className="mt-6">
                        <AdGroupsTabContent campaignId={campaignId} />
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Campaign Settings</CardTitle>
                                <CardDescription>
                                    Manage campaign configuration and preferences
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Campaign settings will be available in a future update.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
