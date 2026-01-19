// Ad Groups Table Component
// Displays ad groups with actions (edit, delete, toggle status)

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Play, Pause } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

import type { AdGroup } from '../types';
import {
    useAdGroups,
    useDeleteAdGroup,
    useToggleAdGroupStatus,
} from '../hooks/use-ad-groups';

// =============================================================================
// Status Badge Styling
// =============================================================================
const statusStyles: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    active: { variant: 'default', label: 'Active' },
    paused: { variant: 'secondary', label: 'Paused' },
    deleted: { variant: 'destructive', label: 'Deleted' },
    archived: { variant: 'outline', label: 'Archived' },
};

// =============================================================================
// Currency Formatter
// =============================================================================
const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
    }).format(value);
};

// =============================================================================
// Props
// =============================================================================
interface AdGroupsTableProps {
    campaignId: string;
    onEdit: (adGroup: AdGroup) => void;
    onCreate?: () => void; // Optional: for empty state button
}

// =============================================================================
// Component
// =============================================================================
export function AdGroupsTable({ campaignId, onEdit, onCreate }: AdGroupsTableProps) {
    const { data: adGroups, isLoading, error } = useAdGroups(campaignId);
    const deleteMutation = useDeleteAdGroup();
    const toggleMutation = useToggleAdGroupStatus();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [adGroupToDelete, setAdGroupToDelete] = useState<AdGroup | null>(null);

    // Delete handlers
    const handleDeleteClick = (adGroup: AdGroup) => {
        setAdGroupToDelete(adGroup);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (adGroupToDelete) {
            deleteMutation.mutate(adGroupToDelete.id);
            setDeleteDialogOpen(false);
            setAdGroupToDelete(null);
        }
    };

    // Toggle status handler
    const handleToggleStatus = (adGroup: AdGroup) => {
        toggleMutation.mutate({
            id: adGroup.id,
            currentStatus: adGroup.status,
        });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 flex-1" />
                    </div>
                ))}
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-destructive">Failed to load ad groups</p>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            </div>
        );
    }

    // Empty state
    if (!adGroups || adGroups.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg
                        className="w-6 h-6 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium">No ad groups found</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Get started by creating your first ad group.
                </p>
                {onCreate && (
                    <Button onClick={onCreate}>
                        Create Ad Group
                    </Button>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Bid Amount</TableHead>
                            <TableHead>Bid Type</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {adGroups.map((adGroup) => {
                            const status = statusStyles[adGroup.status] || statusStyles.active;
                            return (
                                <TableRow key={adGroup.id}>
                                    <TableCell className="font-medium">{adGroup.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={status.variant}>{status.label}</Badge>
                                    </TableCell>
                                    <TableCell>{formatCurrency(adGroup.bidAmount)}</TableCell>
                                    <TableCell>
                                        {adGroup.bidType || <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(adGroup)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleToggleStatus(adGroup)}
                                                    disabled={toggleMutation.isPending}
                                                >
                                                    {adGroup.status === 'active' ? (
                                                        <>
                                                            <Pause className="mr-2 h-4 w-4" />
                                                            Pause
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play className="mr-2 h-4 w-4" />
                                                            Activate
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDeleteClick(adGroup)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the ad group "{adGroupToDelete?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
