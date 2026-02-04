import { Card, CardContent } from "@/components/ui/card";
import { MoveUpRight } from "lucide-react";
import { SeoMetricSummary } from "../types";

interface SeoPremiumCardsProps {
    data: SeoMetricSummary;
    isLoading?: boolean;
}

export function SeoPremiumCards({ data, isLoading }: SeoPremiumCardsProps) {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse h-48 bg-white/50" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* UR Card */}
            <GaugeCard
                title="UR"
                value={data.ur ?? 0}
                maxValue={100}
                color="text-green-500"
                stroke="stroke-green-500"
                empty={data.ur === null}
            />

            {/* DR Card */}
            <GaugeCard
                title="DR"
                value={data.dr ?? 0}
                maxValue={100}
                color="text-orange-400"
                stroke="stroke-orange-400"
                empty={data.dr === null}
            />

            {/* Backlinks Card */}
            <Card className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-3 flex flex-col justify-between h-full">
                    <div className="font-semibold text-sm text-gray-700">Backlinks</div>
                    <div className="mt-2">
                        <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold text-blue-600">
                                {data.backlinks ? data.backlinks.toLocaleString() : "0"}
                            </span>
                            <span className="text-muted-foreground text-xs">Total Backlinks</span>
                        </div>
                    </div>
                    <div className="mt-auto pt-2 space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                            <span>Referring Domains</span>
                            <span className="font-medium text-gray-900">{data.referringDomains ? data.referringDomains.toLocaleString() : "0"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Keywords</span>
                            <span className="font-medium text-gray-900">{data.keywords ? data.keywords.toLocaleString() : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Traffic Cost</span>
                            <span className="font-medium text-gray-900">${data.trafficCost ? data.trafficCost.toLocaleString() : "0"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Organic Search Card */}
            <Card className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-3 flex flex-col justify-between h-full">
                    <div className="font-semibold text-sm text-gray-700">Organic Search</div>
                    <div className="mt-2">
                        <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold text-green-500">
                                {data.organicSessions.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground text-xs">Total Traffic</span>
                        </div>
                        {/* Use Trend if available */}
                        {data.organicSessionsTrend !== undefined && (
                            <div className={`flex items-center w-fit text-xs px-2 py-0.5 rounded-full ${data.organicSessionsTrend >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                                <MoveUpRight className={`h-3 w-3 mr-1 ${data.organicSessionsTrend < 0 ? 'rotate-90' : ''}`} />
                                {Math.abs(data.organicSessionsTrend)}%
                            </div>
                        )}
                    </div>
                    <div className="mt-auto pt-2 space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                            <span>Keywords</span>
                            <span className="font-medium text-gray-900">{data.keywords ? data.keywords.toLocaleString() : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Traffic Cost</span>
                            <span className="font-medium text-gray-900">${data.trafficCost ? data.trafficCost.toLocaleString() : "0"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper Component for Gauge Chart
function GaugeCard({ title, value, maxValue, color, stroke, empty }: { title: string, value: number, maxValue: number, color: string, stroke: string, empty: boolean }) {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    // 75% circle (270 degrees)
    const activeCircumference = circumference * 0.75;
    const percentage = Math.min(Math.max(value / maxValue, 0), 1);

    // Offset logic:
    // Full empty = activeCircumference (dash is pushed fully away)
    // Full full = 0 (dash starts at 0)
    const dashOffset = activeCircumference - (percentage * activeCircumference);

    // Initial animation state (optional, but CSS transition handles updates)

    return (
        <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-3 h-full flex flex-col">
                <div className="font-semibold text-sm text-gray-700 mb-2">{title}</div>
                <div className="flex-1 flex items-center justify-center relative min-h-[110px]">
                    <svg viewBox="0 0 100 100" className="w-full h-full max-w-[130px] max-h-[130px] transform rotate-135">
                        {/* Background Track */}
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-gray-100"
                            strokeDasharray={`${activeCircumference} ${circumference}`}
                            strokeLinecap="round"
                        />
                        {/* Active Progress Bar */}
                        {!empty && (
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="none"
                                className={stroke}
                                strokeWidth="8"
                                strokeDasharray={`${activeCircumference} ${circumference}`}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                            />
                        )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pt-2">
                        <span className={`text-3xl font-bold ${empty ? 'text-gray-300' : 'text-gray-900'}`}>
                            {empty ? "0" : value}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
