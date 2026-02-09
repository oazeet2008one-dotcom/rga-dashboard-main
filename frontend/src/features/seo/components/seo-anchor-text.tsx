import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/formatters";

interface AnchorData {
    keyword: string;
    referringDomains: number;
    percentage: number;
}

const MOCK_ANCHOR_DATA: AnchorData[] = [
    { keyword: "keyword_010", referringDomains: 188, percentage: 50 },
    { keyword: "keyword_009", referringDomains: 176, percentage: 75 },
    { keyword: "keyword_008", referringDomains: 164, percentage: 12 },
    { keyword: "keyword_007", referringDomains: 152, percentage: 11 },
    { keyword: "keyword_006", referringDomains: 140, percentage: 80 },
    { keyword: "keyword_005", referringDomains: 128, percentage: 10 },
    { keyword: "keyword_004", referringDomains: 116, percentage: 9 },
    { keyword: "keyword_003", referringDomains: 104, percentage: 8 },
    { keyword: "keyword_002", referringDomains: 92, percentage: 7 },
    { keyword: "keyword_001", referringDomains: 80, percentage: 6 },
    { keyword: "keyword_011", referringDomains: 75, percentage: 6 },
    { keyword: "keyword_012", referringDomains: 60, percentage: 5 },
    { keyword: "keyword_013", referringDomains: 50, percentage: 4 },
];

export function SeoAnchorText() {
    // Determine color based on direct percentage (0-100)
    const getBarColor = (percentage: number) => {
        // Map 0-100% to Hue (0 = Red, 120 = Green)
        const hue = Math.round((percentage / 100) * 120);
        return `hsl(${hue}, 80%, 45%)`;
    };

    return (
        <Card className="h-[310px] flex flex-col shadow-sm">
            <CardHeader className="p-3 pb-2 border-b flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-xs font-semibold text-gray-700">Anchors</CardTitle>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-normal">Beta</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase">Referring domains</div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 overflow-auto">
                <div className="relative w-full">
                    <div className="w-full text-xs text-left">
                        <div className="divide-y divide-border">
                            {MOCK_ANCHOR_DATA.map((anchor, index) => (
                                <div key={index} className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors">
                                    {/* Left: Keyword */}
                                    <div className="flex-1 font-medium text-gray-700 truncate pr-2">
                                        {anchor.keyword}
                                    </div>

                                    {/* Center: Count & Percentage */}
                                    <div className="flex items-center gap-2 w-24 justify-end text-xs shrink-0">
                                        <span className="font-semibold text-gray-900">{formatCompactNumber(anchor.referringDomains)}</span>
                                        <span className="text-muted-foreground w-8 text-right">{anchor.percentage}%</span>
                                    </div>

                                    {/* Right: Progress Bar */}
                                    <div className="w-14 ml-2 flex items-center shrink-0">
                                        <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${anchor.percentage}%`,
                                                    backgroundColor: getBarColor(anchor.percentage)
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
