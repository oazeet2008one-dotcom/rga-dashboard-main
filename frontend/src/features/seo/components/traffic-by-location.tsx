import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { SeoService } from "../api";
import { formatCompactNumber } from "@/lib/formatters";

// Country flag emojis mapping
const getCountryFlag = (countryCode: string): string => {
    const flagMap: { [key: string]: string } = {
        'TH': '🇹🇭',
        'US': '🇺🇸',
        'GB': '🇬🇧',
        'SG': '🇸🇬',
        'JP': '🇯🇵',
        'MY': '🇲🇾',
        'AU': '🇦🇺'
    };
    return flagMap[countryCode] || '🏳️';
};

interface LocationData {
    country: string;
    city: string;
    traffic: number;
    keywords?: number;
    countryCode: string;
}

interface TrafficByLocationProps {
    isLoading?: boolean;
}

export function TrafficByLocation({ isLoading }: TrafficByLocationProps) {
    const { data: locationData, isLoading: isQueryLoading } = useQuery({
        queryKey: ['seo-traffic-by-location'],
        queryFn: () => SeoService.getTrafficByLocation(),
        enabled: !isLoading
    });

    const loading = isLoading || isQueryLoading;

    if (loading) {
        return <Card className="h-full animate-pulse bg-white/50" />;
    }

    const data = locationData || [];

    // Calculate total traffic for percentage calculation
    const totalTraffic = data.reduce((sum, location) => sum + location.traffic, 0);

    return (
        <Card className="shadow-sm h-full">
            <CardHeader className="p-3 pb-2 border-b">
                <CardTitle className="text-xs font-semibold text-gray-700">Traffic by location</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative w-full overflow-auto max-h-[160px]">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[10px] text-muted-foreground bg-muted/50 uppercase">
                            <tr>
                                <th className="px-3 py-2 font-medium">Location</th>
                                <th className="px-3 py-2 font-medium text-right">Traffic</th>
                                <th className="px-3 py-2 font-medium text-right">Share</th>
                                <th className="px-3 py-2 font-medium text-right">Keywords</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground text-[10px]">
                                        No location data available
                                    </td>
                                </tr>
                            ) : (
                                data.map((location, index) => {
                                    const share = totalTraffic > 0 ? (location.traffic / totalTraffic) * 100 : 0;

                                    return (
                                        <tr key={index} className="hover:bg-muted/30">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={`https://flagcdn.com/w40/${location.countryCode.toLowerCase()}.png`}
                                                        alt={location.country}
                                                        className="w-5 h-auto shadow-sm"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-gray-700">{location.city}</div>
                                                        <div className="text-[10px] text-muted-foreground">{location.country}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <span className="font-medium">{formatCompactNumber(location.traffic)}</span>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <span className="text-muted-foreground">{share.toFixed(1)}%</span>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <span className="text-muted-foreground">{formatCompactNumber(location.keywords || 0)}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
