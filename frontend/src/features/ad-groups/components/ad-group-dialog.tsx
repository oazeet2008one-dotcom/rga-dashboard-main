// AdGroup Dialog - Reusable for Create & Edit
// Uses react-hook-form + zod for validation

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import type { AdGroup, AdGroupStatus } from '../types';
import { useCreateAdGroup, useUpdateAdGroup } from '../hooks/use-ad-groups';

// =============================================================================
// Form Schema
// =============================================================================
const adGroupFormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    status: z.enum(['active', 'paused', 'archived']),
    bidAmount: z.number().min(0).optional(),
    bidType: z.string().optional(),
});

type AdGroupFormValues = z.infer<typeof adGroupFormSchema>;

// =============================================================================
// Props
// =============================================================================
interface AdGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaignId: string;
    initialData?: AdGroup | null; // If provided, use Edit Mode
}

// =============================================================================
// Component
// =============================================================================
export function AdGroupDialog({
    open,
    onOpenChange,
    campaignId,
    initialData,
}: AdGroupDialogProps) {
    const isEditMode = !!initialData;

    // Form setup
    const form = useForm<AdGroupFormValues>({
        resolver: zodResolver(adGroupFormSchema),
        defaultValues: {
            name: '',
            status: 'active',
            bidAmount: undefined,
            bidType: '',
        },
    });

    // Mutations
    const createMutation = useCreateAdGroup({
        onSuccess: () => onOpenChange(false),
    });

    const updateMutation = useUpdateAdGroup({
        onSuccess: () => onOpenChange(false),
    });

    const isPending = createMutation.isPending || updateMutation.isPending;

    // Reset form when dialog opens/closes or initialData changes
    useEffect(() => {
        if (open) {
            if (initialData) {
                // Edit mode - prefill form
                form.reset({
                    name: initialData.name,
                    status: initialData.status as AdGroupFormValues['status'],
                    bidAmount: initialData.bidAmount ?? undefined,
                    bidType: initialData.bidType ?? '',
                });
            } else {
                // Create mode - reset to defaults
                form.reset({
                    name: '',
                    status: 'active',
                    bidAmount: undefined,
                    bidType: '',
                });
            }
        }
    }, [open, initialData, form]);

    // Form submission
    const onSubmit = (values: AdGroupFormValues) => {
        if (isEditMode && initialData) {
            // Update existing ad group
            updateMutation.mutate({
                id: initialData.id,
                data: {
                    name: values.name,
                    status: values.status as AdGroupStatus,
                    bidAmount: values.bidAmount,
                    bidType: values.bidType || undefined,
                },
            });
        } else {
            // Create new ad group
            createMutation.mutate({
                name: values.name,
                campaignId,
                status: values.status as AdGroupStatus,
                bidAmount: values.bidAmount,
                bidType: values.bidType || undefined,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? 'Edit Ad Group' : 'Create Ad Group'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? 'Update the ad group details below.'
                            : 'Add a new ad group to this campaign.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name Field */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Thailand Audience - Desktop"
                                            {...field}
                                        />
                                    </FormControl>
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
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="paused">Paused</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Paused ad groups won't run until activated.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Bid Amount */}
                        <FormField
                            control={form.control}
                            name="bidAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bid Amount (THB)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                ฿
                                            </span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="2.50"
                                                className="pl-8"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    field.onChange(value === '' ? undefined : parseFloat(value));
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Maximum bid per click or impression.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Bid Type */}
                        <FormField
                            control={form.control}
                            name="bidType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bid Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select bid type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="CPC">CPC (Cost Per Click)</SelectItem>
                                            <SelectItem value="CPM">CPM (Cost Per 1000 Impressions)</SelectItem>
                                            <SelectItem value="CPA">CPA (Cost Per Action)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditMode ? 'Save Changes' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
