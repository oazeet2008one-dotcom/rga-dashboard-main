/**
 * Account Selection Dialog
 * 
 * Modal for selecting an ad account after OAuth callback.
 * Shows list of available accounts with radio selection.
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { TempAccount } from '../types';

interface AccountSelectionDialogProps {
    /** Whether dialog is open */
    isOpen: boolean;
    /** Callback when open state changes */
    onOpenChange: (open: boolean) => void;
    /** List of available accounts */
    accounts: TempAccount[];
    /** Callback when user confirms selection */
    onConfirm: (accountId: string) => void;
    /** Whether confirmation is in progress */
    isPending?: boolean;
    /** Platform name for display */
    platformName?: string;
}

export function AccountSelectionDialog({
    isOpen,
    onOpenChange,
    accounts,
    onConfirm,
    isPending = false,
    platformName = 'Ad Platform',
}: AccountSelectionDialogProps) {
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');

    const handleConfirm = () => {
        if (selectedAccountId) {
            onConfirm(selectedAccountId);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Reset selection when closing
            setSelectedAccountId('');
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select {platformName} Account</DialogTitle>
                    <DialogDescription>
                        Choose an ad account to connect. You can change this later in settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {accounts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No accounts found. Please check your permissions.
                        </div>
                    ) : (
                        <RadioGroup
                            value={selectedAccountId}
                            onValueChange={setSelectedAccountId}
                            className="gap-3"
                        >
                            {accounts.map((account) => (
                                <div
                                    key={account.id}
                                    className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedAccountId(account.id)}
                                >
                                    <RadioGroupItem value={account.id} id={account.id} />
                                    <Label
                                        htmlFor={account.id}
                                        className="flex-1 cursor-pointer"
                                    >
                                        <div className="font-medium">{account.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            ID: {account.id}
                                            {account.status && (
                                                <span className="ml-2">• {account.status}</span>
                                            )}
                                        </div>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedAccountId || isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            'Connect Account'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
