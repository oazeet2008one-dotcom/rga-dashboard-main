import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

import {
    createCampaignSchema,
    CreateCampaignFormData,
    defaultCampaignValues,
} from '../types/schema';
import { useCreateCampaign, useUpdateCampaign } from '../hooks/use-campaign-mutations';
import type { Campaign } from '../types';

// =============================================================================
// Props Interface - Supports Create and Edit modes
// =============================================================================
interface CampaignSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Campaign to edit. If provided, sheet opens in Edit mode. */
    campaign?: Campaign | null;
}

// =============================================================================
// Helper: Convert Campaign to Form Data
// =============================================================================
function campaignToFormData(campaign: Campaign): CreateCampaignFormData {
    return {
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status === 'completed' ? 'active' : campaign.status, // Map completed to active for editing
        budget: campaign.budget,
        startDate: new Date(campaign.startDate),
        endDate: campaign.endDate ? new Date(campaign.endDate) : undefined,
    };
}

// =============================================================================
// Campaign Sheet Component
// =============================================================================
export function CampaignSheet({
    open,
    onOpenChange,
    campaign,
}: CampaignSheetProps) {
    // Determine mode based on campaign prop
    const isEditMode = Boolean(campaign?.id);
    const campaignId = campaign?.id;

    // Initialize form with Zod resolver
    const form = useForm<CreateCampaignFormData>({
        resolver: zodResolver(createCampaignSchema),
        defaultValues: defaultCampaignValues,
    });

    // Mutations
    const createMutation = useCreateCampaign({
        onSuccess: () => onOpenChange(false),
    });

    const updateMutation = useUpdateCampaign({
        onSuccess: () => onOpenChange(false),
    });

    // Determine which mutation is pending
    const isPending = createMutation.isPending || updateMutation.isPending;

    // Reset form when sheet opens or campaign changes
    useEffect(() => {
        if (open) {
            if (campaign) {
                // Edit mode: populate form with campaign data
                const formData = campaignToFormData(campaign);
                form.reset(formData);
            } else {
                // Create mode: reset to defaults
                form.reset(defaultCampaignValues);
            }
        }
    }, [open, campaign, form]);

    // Form submission handler
    const onSubmit = (values: CreateCampaignFormData) => {
        if (isEditMode && campaignId) {
            updateMutation.mutate({ id: campaignId, data: values });
        } else {
            createMutation.mutate(values);
        }
    };

    // Dynamic text based on mode
    const sheetTitle = isEditMode ? 'Edit Campaign' : 'Create Campaign';
    const sheetDescription = isEditMode
        ? 'Update the campaign details below.'
        : 'Set up a new advertising campaign. Fill in the details below.';
    const submitButtonText = useMemo(() => {
        if (isPending) {
            return isEditMode ? 'Saving...' : 'Creating...';
        }
        return isEditMode ? 'Save Changes' : 'Create Campaign';
    }, [isPending, isEditMode]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[480px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{sheetTitle}</SheetTitle>
                    <SheetDescription>{sheetDescription}</SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 py-6"
                    >
                        {/* Campaign Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Campaign Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Summer Sale 2026" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Platform Select */}
                        <FormField
                            control={form.control}
                            name="platform"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Platform</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a platform" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="google">Google Ads</SelectItem>
                                            <SelectItem value="facebook">Facebook</SelectItem>
                                            <SelectItem value="tiktok">TikTok</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Status Select */}
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="paused">Paused</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Draft campaigns won't run until activated.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Budget Input */}
                        <FormField
                            control={form.control}
                            name="budget"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Budget (THB)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                ฿
                                            </span>
                                            <Input
                                                type="number"
                                                placeholder="50,000"
                                                className="pl-8"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value)}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Total budget for this campaign.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Start Date Picker */}
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Start Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, 'PPP')
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < new Date('2020-01-01')}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* End Date Picker (Optional) */}
                        <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>End Date (Optional)</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, 'PPP')
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date('2020-01-01') ||
                                                    (form.getValues('startDate') &&
                                                        date <= form.getValues('startDate'))
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Leave empty for ongoing campaigns.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <SheetFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {submitButtonText}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}

// Keep legacy export for backwards compatibility
export { CampaignSheet as CreateCampaignSheet };
