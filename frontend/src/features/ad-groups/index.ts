// Ad Groups Feature - Barrel Exports

// Types
export * from './types';

// Service
export { AdGroupService } from './api/ad-groups-service';

// Hooks
export {
    AD_GROUPS_QUERY_KEY,
    getAdGroupsQueryKey,
    useAdGroups,
    useAllAdGroups,
    useAdGroup,
    useCreateAdGroup,
    useUpdateAdGroup,
    useDeleteAdGroup,
    useToggleAdGroupStatus,
} from './hooks/use-ad-groups';

// Components
export { AdGroupDialog } from './components/ad-group-dialog';
export { AdGroupsTable } from './components/ad-groups-table';
export { AdGroupsTabContent } from './components/ad-groups-tab-content';
