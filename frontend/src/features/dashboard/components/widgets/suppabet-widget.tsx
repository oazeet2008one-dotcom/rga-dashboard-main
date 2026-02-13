import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface Match {
    id: string;
    matchName: string;
    sportType: string;
    date: string;
    homeScore: number;
    awayScore: number;
    status: string;
    profit: number;
}

interface SuppabetWidgetProps {
    matches: Match[];
    loading?: boolean;
}

export function SuppabetWidget({ matches, loading }: SuppabetWidgetProps) {
    if (loading) {
        return <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-xl" />;
    }

    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    ⚽ Recent Matches (Suppabet)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Match</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead className="text-right">Profit (THB)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matches.slice(0, 10).map((match) => (
                                <TableRow key={match.id}>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(match.date), 'MMM dd')}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{match.matchName}</span>
                                            <span className="text-[10px] uppercase text-muted-foreground">{match.sportType}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {match.homeScore} - {match.awayScore}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${match.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {match.profit.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
