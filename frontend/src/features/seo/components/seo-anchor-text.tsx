import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/formatters";
import { useState, useEffect } from "react";
import { SeoService } from "../api";

interface AnchorData {
    text: string;
    referringDomains: number;
    totalBacklinks: number;
    dofollowBacklinks: number;
    traffic: number;
    trafficPercentage: number;
}

export function SeoAnchorText() {
    const [anchorData, setAnchorData] = useState<AnchorData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnchorData = async () => {
            try {
                console.log('Fetching anchor text data...');
                const data = await SeoService.getAnchorTexts();
                console.log('Anchor text data received:', data);
                setAnchorData(data);
            } catch (error: any) {
                console.error("Failed to fetch anchor text data:", error);
                // Fallback to mock data
                setAnchorData([
                    { text: "click here", referringDomains: 45, totalBacklinks: 234, dofollowBacklinks: 189, traffic: 1250, trafficPercentage: 12.5 },
                    { text: "learn more", referringDomains: 38, totalBacklinks: 198, dofollowBacklinks: 167, traffic: 980, trafficPercentage: 9.8 },
                    { text: "read more", referringDomains: 32, totalBacklinks: 156, dofollowBacklinks: 134, traffic: 850, trafficPercentage: 8.5 },
                    { text: "view details", referringDomains: 28, totalBacklinks: 142, dofollowBacklinks: 121, traffic: 720, trafficPercentage: 7.2 },
                    { text: "shop now", referringDomains: 25, totalBacklinks: 128, dofollowBacklinks: 109, traffic: 650, trafficPercentage: 6.5 },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchAnchorData();
    }, []);

    // Determine color based on direct percentage (0-100)
    const getBarColor = (percentage: number) => {
        // Map 0-100% to Hue (0 = Red, 120 = Green)
        const hue = Math.round((percentage / 100) * 120);
        return `hsl(${hue}, 80%, 45%)`;
    };

    if (loading) {
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
                    <div className="flex items-center justify-center h-full">
                        <div className="text-xs text-muted-foreground">Loading...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

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
                            {anchorData.map((anchor, index) => (
                                <div key={index} className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors">
                                    {/* Left: Anchor Text */}
                                    <div className="flex-1 font-medium text-gray-700 truncate pr-2">
                                        {anchor.text}
                                    </div>

                                    {/* Center: Count & Percentage */}
                                    <div className="flex items-center gap-2 w-24 justify-end text-xs shrink-0">
                                        <span className="font-semibold text-gray-900">{formatCompactNumber(anchor.referringDomains)}</span>
                                        <span className="text-muted-foreground w-8 text-right">{Math.round(anchor.trafficPercentage)}%</span>
                                    </div>

                                    {/* Right: Progress Bar */}
                                    <div className="w-14 ml-2 flex items-center shrink-0">
                                        <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${anchor.trafficPercentage}%`,
                                                    backgroundColor: getBarColor(anchor.trafficPercentage)
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
