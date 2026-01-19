import { Link } from 'wouter';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Edit, Trash2, Pause, Play } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { Campaign, STATUS_STYLES, PLATFORM_LABELS } from '../types';

interface CampaignsTableProps {
    campaigns: Campaign[];
    onView?: (campaign: Campaign) => void;
    onEdit?: (campaign: Campaign) => void;
    onDelete?: (campaign: Campaign) => void;
    onToggleStatus?: (campaign: Campaign) => void;
}

// Format currency as THB
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Format large numbers with commas
const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('th-TH').format(num);
};

// Format date as "dd MMM yyyy"
const formatDate = (dateString: string): string => {
    try {
        return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
        return '-';
    }
};

// Calculate CTR percentage
const calculateCTR = (clicks: number, impressions: number): string => {
    if (impressions === 0) return '0%';
    return ((clicks / impressions) * 100).toFixed(2) + '%';
};

export function CampaignsTable({
    campaigns,
    onView,
    onEdit,
    onDelete,
    onToggleStatus,
}: CampaignsTableProps) {
    // Empty state
    if (campaigns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                    <svg
                        className="h-8 w-8 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">No campaigns found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Get started by creating your first campaign.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">Campaign</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Spent</TableHead>
                        <TableHead className="text-right">Impressions</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                            {/* Campaign Name - Clickable Link */}
                            <TableCell>
                                <Link href={`/campaigns/${campaign.id}`}>
                                    <span className="font-medium hover:underline text-primary cursor-pointer">
                                        {campaign.name}
                                    </span>
                                </Link>
                            </TableCell>

                            {/* Status Badge */}
                            <TableCell>
                                <Badge
                                    variant="secondary"
                                    className={STATUS_STYLES[campaign.status]}
                                >
                                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                </Badge>
                            </TableCell>

                            {/* Platform */}
                            <TableCell className="text-muted-foreground">
                                {PLATFORM_LABELS[campaign.platform]}
                            </TableCell>

                            {/* Budget */}
                            <TableCell className="text-right font-medium">
                                {formatCurrency(campaign.budget)}
                            </TableCell>

                            {/* Spent */}
                            <TableCell className="text-right">
                                {formatCurrency(campaign.spent)}
                            </TableCell>

                            {/* Impressions */}
                            <TableCell className="text-right">
                                {formatNumber(campaign.impressions)}
                            </TableCell>

                            {/* CTR */}
                            <TableCell className="text-right">
                                {calculateCTR(campaign.clicks, campaign.impressions)}
                            </TableCell>

                            {/* Duration (Start - End Date) */}
                            <TableCell className="text-sm text-muted-foreground">
                                {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                            </TableCell>

                            {/* Actions Dropdown */}
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Open menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onView?.(campaign)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit?.(campaign)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Campaign
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onToggleStatus?.(campaign)}>
                                            {campaign.status === 'active' ? (
                                                <>
                                                    <Pause className="mr-2 h-4 w-4" />
                                                    Pause Campaign
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="mr-2 h-4 w-4" />
                                                    Activate Campaign
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onDelete?.(campaign)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Campaign
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
