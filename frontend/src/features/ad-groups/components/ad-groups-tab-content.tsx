// Ad Groups Tab Content - Container Component
// Manages state for dialog and renders table

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { AdGroup } from '../types';
import { AdGroupDialog } from './ad-group-dialog';
import { AdGroupsTable } from './ad-groups-table';

// =============================================================================
// Props
// =============================================================================
interface AdGroupsTabContentProps {
    campaignId: string;
}

// =============================================================================
// Component
// =============================================================================
export function AdGroupsTabContent({ campaignId }: AdGroupsTabContentProps) {
    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedAdGroup, setSelectedAdGroup] = useState<AdGroup | null>(null);

    // Handlers
    const handleCreate = () => {
        setSelectedAdGroup(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (adGroup: AdGroup) => {
        setSelectedAdGroup(adGroup);
        setIsDialogOpen(true);
    };

    const handleDialogClose = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            // Clear selection when dialog closes
            setSelectedAdGroup(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Ad Groups</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage ad groups for this campaign
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Ad Group
                </Button>
            </div>

            {/* Table */}
            <AdGroupsTable
                campaignId={campaignId}
                onEdit={handleEdit}
                onCreate={handleCreate}
            />

            {/* Dialog (Create/Edit) */}
            <AdGroupDialog
                open={isDialogOpen}
                onOpenChange={handleDialogClose}
                campaignId={campaignId}
                initialData={selectedAdGroup}
            />
        </div>
    );
}

// Re-export for convenience
export { AdGroupDialog } from './ad-group-dialog';
export { AdGroupsTable } from './ad-groups-table';
