// =============================================================================
// AlertRulesTab - Watchdog Rules Management Interface
// =============================================================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Plus,
    Pencil,
    Trash2,
    ShieldAlert,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { alertService, type AlertRule } from '@/services/alert-service';
import { RuleFormDialog } from './RuleFormDialog';
import { cn } from '@/lib/utils';

// =============================================================================
// Constants
// =============================================================================

const OPERATOR_LABELS: Record<string, string> = {
    gt: '>',
    lt: '<',
    gte: '≥',
    lte: '≤',
    eq: '=',
};

const METRIC_LABELS: Record<string, string> = {
    ctr: 'CTR',
    cpc: 'CPC',
    roas: 'ROAS',
    spend: 'Spend',
    impressions: 'Impressions',
    clicks: 'Clicks',
    conversions: 'Conversions',
};

const SEVERITY_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; className: string }> = {
    CRITICAL: { label: 'Critical', variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200' },
    WARNING: { label: 'Warning', variant: 'secondary', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    INFO: { label: 'Info', variant: 'default', className: 'bg-blue-100 text-blue-700 border-blue-200' },
};

// =============================================================================
// Helper Functions
// =============================================================================

function formatCondition(metric: string, operator: string, threshold: number): string {
    const metricLabel = METRIC_LABELS[metric] || metric.toUpperCase();
    const opLabel = OPERATOR_LABELS[operator] || operator;

    // Format threshold based on metric type
    let formattedThreshold: string;
    if (metric === 'ctr' || metric === 'roas') {
        formattedThreshold = threshold.toFixed(2);
        if (metric === 'ctr') formattedThreshold += '%';
    } else if (metric === 'spend' || metric === 'cpc') {
        formattedThreshold = `$${threshold.toFixed(2)}`;
    } else {
        formattedThreshold = threshold.toLocaleString();
    }

    return `${metricLabel} ${opLabel} ${formattedThreshold}`;
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function TableSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                    <Skeleton className="h-5 w-10" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20 ml-auto" />
                </div>
            ))}
        </div>
    );
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState({ onAddRule }: { onAddRule: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldAlert className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Alert Rules</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Create your first alert rule to automatically monitor campaign metrics and get notified when thresholds are breached.
            </p>
            <Button onClick={onAddRule}>
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
            </Button>
        </div>
    );
}

// =============================================================================
// Main Component
// =============================================================================

export function AlertRulesTab() {
    const queryClient = useQueryClient();

    // Dialog states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
    const [deletingRule, setDeletingRule] = useState<AlertRule | null>(null);

    // =========================================================================
    // Queries
    // =========================================================================

    const { data: rules = [], isLoading, isError } = useQuery({
        queryKey: ['alert-rules'],
        queryFn: async () => {
            const response = await alertService.getRules();
            return response.data as AlertRule[];
        },
    });

    // =========================================================================
    // Mutations
    // =========================================================================

    const createMutation = useMutation({
        mutationFn: (data: Parameters<typeof alertService.createRule>[0]) =>
            alertService.createRule(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
            setIsFormOpen(false);
            toast.success('Rule created', { description: 'Alert rule has been created successfully.' });
        },
        onError: (error) => {
            toast.error('Failed to create rule', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AlertRule> }) =>
            alertService.updateRule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
            setIsFormOpen(false);
            setEditingRule(null);
            toast.success('Rule updated', { description: 'Alert rule has been updated.' });
        },
        onError: (error) => {
            toast.error('Failed to update rule', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        },
    });

    const toggleMutation = useMutation({
        mutationFn: (id: string) => alertService.toggleRule(id),
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['alert-rules'] });

            // Snapshot previous value
            const previousRules = queryClient.getQueryData<AlertRule[]>(['alert-rules']);

            // Optimistically update
            queryClient.setQueryData<AlertRule[]>(['alert-rules'], (old) =>
                old?.map((rule) =>
                    rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
                )
            );

            return { previousRules };
        },
        onError: (err, id, context) => {
            // Rollback on error
            queryClient.setQueryData(['alert-rules'], context?.previousRules);
            toast.error('Failed to toggle rule');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => alertService.deleteRule(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
            setDeletingRule(null);
            toast.success('Rule deleted', { description: 'Alert rule has been removed.' });
        },
        onError: (error) => {
            toast.error('Failed to delete rule', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        },
    });

    // =========================================================================
    // Handlers
    // =========================================================================

    const handleAddRule = () => {
        setEditingRule(null);
        setIsFormOpen(true);
    };

    const handleEditRule = (rule: AlertRule) => {
        setEditingRule(rule);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (data: {
        name: string;
        metric: string;
        operator: string;
        threshold: number;
        severity: 'INFO' | 'WARNING' | 'CRITICAL';
        description?: string;
    }) => {
        if (editingRule) {
            await updateMutation.mutateAsync({ id: editingRule.id, data });
        } else {
            await createMutation.mutateAsync(data);
        }
    };

    const handleDeleteConfirm = () => {
        if (deletingRule) {
            deleteMutation.mutate(deletingRule.id);
        }
    };

    // =========================================================================
    // Render
    // =========================================================================

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5" />
                        Watchdog Rules
                    </CardTitle>
                    <CardDescription>
                        Automatically monitor campaigns and get notified when metrics breach thresholds.
                    </CardDescription>
                </div>
                <Button onClick={handleAddRule}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                </Button>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <TableSkeleton />
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center py-8 text-destructive">
                        <AlertTriangle className="h-8 w-8 mb-2" />
                        <p>Failed to load rules. Please try again.</p>
                    </div>
                ) : rules.length === 0 ? (
                    <EmptyState onAddRule={handleAddRule} />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Active</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Condition</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.map((rule) => {
                                const severityConfig = SEVERITY_CONFIG[rule.severity];
                                const isPreset = rule.type === 'PRESET';

                                return (
                                    <TableRow key={rule.id}>
                                        <TableCell>
                                            <Switch
                                                checked={rule.isActive}
                                                onCheckedChange={() => toggleMutation.mutate(rule.id)}
                                                disabled={toggleMutation.isPending}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {rule.name}
                                            {rule.description && (
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {rule.description}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-sm bg-muted px-2 py-1 rounded">
                                                {formatCondition(rule.metric, rule.operator, rule.threshold)}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn('font-medium', severityConfig?.className)}
                                            >
                                                {severityConfig?.label || rule.severity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={isPreset ? 'secondary' : 'outline'}>
                                                {isPreset ? 'Preset' : 'Custom'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditRule(rule)}
                                                    disabled={isPreset}
                                                    title={isPreset ? 'Preset rules cannot be edited' : 'Edit rule'}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingRule(rule)}
                                                    disabled={isPreset}
                                                    title={isPreset ? 'Preset rules cannot be deleted' : 'Delete rule'}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Form Dialog */}
            <RuleFormDialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) setEditingRule(null);
                }}
                rule={editingRule}
                onSubmit={handleFormSubmit}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingRule} onOpenChange={(open) => !open && setDeletingRule(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Alert Rule</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deletingRule?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
