import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/formatters";
import { useEffect, useState } from "react";
import { SeoService } from "../api";

interface KeywordData {
    keyword: string;
    position: number;
    volume: number;
    cpc?: number;
    trafficPercent: number;
}

export function TopOrganicKeywords() {
    const [keywords, setKeywords] = useState<KeywordData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKeywords = async () => {
            try {
                const data = await SeoService.getTopKeywords();
                setKeywords(data);
            } catch (error) {
                console.error("Failed to fetch keywords:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchKeywords();
    }, []);

    if (loading) {
        return (
            <Card className="h-[400px] flex flex-col shadow-sm">
                <CardHeader className="px-4 py-3 border-b shrink-0 flex flex-row items-center gap-2">
                    <CardTitle className="text-base font-semibold text-gray-800">Top Organic Keywords</CardTitle>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-normal">Beta</span>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-0 overflow-auto">
                    <div className="flex items-center justify-center h-full">
                        <div className="text-sm text-muted-foreground">Loading...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-[400px] flex flex-col shadow-sm">
            <CardHeader className="px-4 py-3 border-b shrink-0 flex flex-row items-center gap-2">
                <CardTitle className="text-base font-semibold text-gray-800">Top Organic Keywords</CardTitle>
                <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-normal">Beta</span>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 overflow-auto">
                <table className="w-full caption-bottom text-xs text-left">
                    <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                        <tr className="border-b border-border">
                            <th className="h-8 px-4 text-left align-middle font-medium text-muted-foreground w-[40%]">Keywords</th>
                            <th className="h-8 px-4 text-left align-middle font-medium text-muted-foreground w-[15%]">pos.</th>
                            <th className="h-8 px-4 text-left align-middle font-medium text-muted-foreground w-[15%]">Volume</th>
                            <th className="h-8 px-4 text-left align-middle font-medium text-muted-foreground w-[15%]">CPC(USD)</th>
                            <th className="h-8 px-4 text-left align-middle font-medium text-muted-foreground w-[15%]">Traffic, %</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0 text-xs">
                        {keywords.map((item, index) => (
                            <tr key={index} className="border-b border-border transition-colors hover:bg-muted/30">
                                <td className="p-2 px-4 align-middle font-medium text-blue-600 cursor-pointer hover:underline truncate max-w-[150px]">
                                    {item.keyword}
                                </td>
                                <td className="p-2 px-4 align-middle text-gray-700">
                                    {item.position}
                                </td>
                                <td className="p-2 px-4 align-middle">
                                    <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium text-[10px]">
                                        {formatCompactNumber(item.volume)}
                                    </span>
                                </td>
                                <td className="p-2 px-4 align-middle text-gray-600">
                                    {item.cpc !== undefined && item.cpc !== null ? `$${item.cpc.toFixed(2)}` : '-'}
                                </td>
                                <td className="p-2 px-4 align-middle text-gray-700">
                                    {item.trafficPercent}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}
