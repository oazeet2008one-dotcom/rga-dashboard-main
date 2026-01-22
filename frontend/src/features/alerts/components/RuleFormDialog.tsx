// =============================================================================
// RuleFormDialog - Create/Edit Alert Rule Modal
// =============================================================================

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { AlertRule } from '@/services/alert-service';

// =============================================================================
// Schema
// =============================================================================

const ruleFormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    metric: z.string().min(1, 'Metric is required'),
    operator: z.string().min(1, 'Operator is required'),
    threshold: z.coerce.number().min(0, 'Threshold must be positive'),
    severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
    description: z.string().optional(),
});

type RuleFormValues = z.infer<typeof ruleFormSchema>;

// =============================================================================
// Options
// =============================================================================

const METRIC_OPTIONS = [
    { value: 'ctr', label: 'CTR (Click-Through Rate)' },
    { value: 'cpc', label: 'CPC (Cost Per Click)' },
    { value: 'roas', label: 'ROAS (Return on Ad Spend)' },
    { value: 'spend', label: 'Spend (Total Cost)' },
    { value: 'impressions', label: 'Impressions' },
    { value: 'clicks', label: 'Clicks' },
    { value: 'conversions', label: 'Conversions' },
];

const OPERATOR_OPTIONS = [
    { value: 'gt', label: 'Greater than (>)' },
    { value: 'lt', label: 'Less than (<)' },
    { value: 'gte', label: 'Greater or equal (≥)' },
    { value: 'lte', label: 'Less or equal (≤)' },
    { value: 'eq', label: 'Equal to (=)' },
];

const SEVERITY_OPTIONS = [
    { value: 'INFO', label: 'Info', className: 'text-blue-600' },
    { value: 'WARNING', label: 'Warning', className: 'text-yellow-600' },
    { value: 'CRITICAL', label: 'Critical', className: 'text-red-600' },
];

// =============================================================================
// Props
// =============================================================================

interface RuleFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rule?: AlertRule | null;
    onSubmit: (data: RuleFormValues) => Promise<void>;
    isSubmitting?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function RuleFormDialog({
    open,
    onOpenChange,
    rule,
    onSubmit,
    isSubmitting = false,
}: RuleFormDialogProps) {
    const isEditing = !!rule;

    const form = useForm<RuleFormValues>({
        resolver: zodResolver(ruleFormSchema) as any,
        defaultValues: {
            name: '',
            metric: 'ctr',
            operator: 'lt',
            threshold: 1,
            severity: 'WARNING',
            description: '',
        },
    });

    // Reset form when rule changes
    useEffect(() => {
        if (rule) {
            form.reset({
                name: rule.name,
                metric: rule.metric,
                operator: rule.operator,
                threshold: rule.threshold,
                severity: rule.severity,
                description: rule.description || '',
            });
        } else {
            form.reset({
                name: '',
                metric: 'ctr',
                operator: 'lt',
                threshold: 1,
                severity: 'WARNING',
                description: '',
            });
        }
    }, [rule, form]);

    const handleSubmit = async (values: RuleFormValues) => {
        await onSubmit(values);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Alert Rule' : 'Create Alert Rule'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modify the alert rule configuration.'
                            : 'Create a new rule to monitor your campaigns.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rule Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Low CTR Alert" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Metric & Operator Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="metric"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Metric</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select metric" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {METRIC_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="operator"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Condition</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select operator" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {OPERATOR_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Threshold & Severity Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="threshold"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Threshold</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="1.0"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            The value to compare against
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="severity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Severity</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select severity" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {SEVERITY_OPTIONS.map((opt) => (
                                                    <SelectItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                        className={opt.className}
                                                    >
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe what this rule monitors..."
                                            className="resize-none"
                                            rows={2}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Save Changes' : 'Create Rule'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
