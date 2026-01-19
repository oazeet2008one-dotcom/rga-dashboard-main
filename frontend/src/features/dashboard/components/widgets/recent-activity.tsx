// src/features/dashboard/components/widgets/recent-activity.tsx
// =============================================================================
// Recent Activity Widget - Displays Recent Sales/Activity
// =============================================================================

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrencyTHB } from '@/lib/formatters';

// =============================================================================
// Type Definitions
// =============================================================================

export interface RecentActivityItem {
    id: string;
    user: {
        name: string;
        email: string;
        avatar?: string;
    };
    amount: number;
    status: string;
}

// =============================================================================
// Demo Data (Fallback for fresh database)
// =============================================================================

const DEMO_DATA: RecentActivityItem[] = [
    {
        id: '1',
        user: {
            name: 'Olivia Martin',
            email: 'olivia.martin@email.com',
            avatar: undefined,
        },
        amount: 1999,
        status: 'completed',
    },
    {
        id: '2',
        user: {
            name: 'Jackson Lee',
            email: 'jackson.lee@email.com',
            avatar: undefined,
        },
        amount: 3900,
        status: 'completed',
    },
    {
        id: '3',
        user: {
            name: 'Isabella Nguyen',
            email: 'isabella.nguyen@email.com',
            avatar: undefined,
        },
        amount: 2999,
        status: 'completed',
    },
    {
        id: '4',
        user: {
            name: 'William Kim',
            email: 'will@email.com',
            avatar: undefined,
        },
        amount: 9900,
        status: 'completed',
    },
    {
        id: '5',
        user: {
            name: 'Sofia Davis',
            email: 'sofia.davis@email.com',
            avatar: undefined,
        },
        amount: 3900,
        status: 'completed',
    },
];

// =============================================================================
// Helper Functions
// =============================================================================

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// =============================================================================
// Props Interface
// =============================================================================

interface RecentActivityProps {
    /** Array of recent activity items */
    data: RecentActivityItem[];
    /** Optional class name */
    className?: string;
}

// =============================================================================
// Main Component
// =============================================================================

export function RecentActivity({ data, className }: RecentActivityProps) {
    // Use demo data if no data provided (fresh DB fallback)
    const displayData = data?.length > 0 ? data : DEMO_DATA;

    return (
        <Card className={`h-[400px] flex flex-col ${className ?? ''}`}>
            <CardHeader>
                <CardTitle className="text-base font-semibold">
                    Recent Sales
                </CardTitle>
                <CardDescription>
                    You made {displayData.length * 53} sales this month.
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-6">
                        {displayData.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-9 w-9">
                                        {item.user.avatar && (
                                            <AvatarImage
                                                src={item.user.avatar}
                                                alt={item.user.name}
                                            />
                                        )}
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                            {getInitials(item.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium leading-none">
                                            {item.user.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.user.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="font-medium text-sm">
                                    +{formatCurrencyTHB(item.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export default RecentActivity;
