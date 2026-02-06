import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/formatters";

interface KeywordData {
    keyword: string;
    position: number;
    volume: number;
    cpc: number;
    trafficPercent: number;
}

const MOCK_KEYWORD_DATA: KeywordData[] = [
    { keyword: "keyword_010", position: 7.2, volume: 2820, cpc: 0, trafficPercent: 14 },
    { keyword: "keyword_009", position: 8.4, volume: 2640, cpc: 0, trafficPercent: 13.1 },
    { keyword: "keyword_008", position: 9.6, volume: 2460, cpc: 0, trafficPercent: 12.2 },
    { keyword: "keyword_007", position: 10.8, volume: 2280, cpc: 0, trafficPercent: 11.3 },
    { keyword: "keyword_006", position: 12.0, volume: 2100, cpc: 0, trafficPercent: 10.4 },
    { keyword: "keyword_005", position: 13.2, volume: 1920, cpc: 0, trafficPercent: 9.6 },
    { keyword: "keyword_004", position: 14.4, volume: 1740, cpc: 0, trafficPercent: 8.7 },
    { keyword: "keyword_003", position: 15.6, volume: 1560, cpc: 0, trafficPercent: 7.8 },
    { keyword: "keyword_002", position: 16.8, volume: 1380, cpc: 0, trafficPercent: 6.9 },
    { keyword: "keyword_001", position: 18.0, volume: 1200, cpc: 0, trafficPercent: 6 },
];

export function TopOrganicKeywords() {
    return (
        <Card className="h-[325px] flex flex-col shadow-sm">
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
                        {MOCK_KEYWORD_DATA.map((item, index) => (
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
                                    {item.cpc}
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
