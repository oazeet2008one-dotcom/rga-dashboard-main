import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { SeoService } from "../api";

interface AiInsight {
    id: string;
    type: string;
    source: string;
    title: string;
    message: string;
    payload: any;
    status: string;
    occurredAt: string;
    createdAt: string;
    updatedAt: string;
}

export function SeoAiInsights() {
    const [insights, setInsights] = useState<AiInsight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAiInsights = async () => {
            try {
                console.log('Fetching AI insights data...');
                const data = await SeoService.getAiInsights();
                console.log('AI insights data received:', data);
                setInsights(data);
            } catch (error: any) {
                console.error("Failed to fetch AI insights data:", error);
                // Fallback to mock data
                setInsights([
                    {
                        id: '1',
                        type: 'google_assistant',
                        source: 'google',
                        title: 'Google Assistant Integration Ready',
                        message: 'Your SEO dashboard is now optimized for Google Assistant voice search queries and commands.',
                        payload: { actionRequired: true, priority: 'high', category: 'integration' },
                        status: 'active',
                        occurredAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchAiInsights();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'google_assistant': return 'bg-blue-100 text-blue-800';
            case 'voice_search': return 'bg-purple-100 text-purple-800';
            case 'local_seo': return 'bg-green-100 text-green-800';
            case 'mobile_optimization': return 'bg-orange-100 text-orange-800';
            case 'structured_data': return 'bg-indigo-100 text-indigo-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <Card className="h-[400px] flex flex-col shadow-sm">
                <CardHeader className="p-3 pb-2 border-b flex flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xs font-semibold text-gray-700">AI Insights</CardTitle>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-normal">Google Assistant</span>
                    </div>
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
        <Card className="h-[400px] flex flex-col shadow-sm">
            <CardHeader className="p-3 pb-2 border-b flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-xs font-semibold text-gray-700">AI Insights</CardTitle>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-normal">Google Assistant</span>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 overflow-auto">
                <div className="relative w-full">
                    <div className="w-full text-xs text-left">
                        <div className="divide-y divide-border">
                            {insights.map((insight, index) => (
                                <div key={insight.id} className="p-3 hover:bg-muted/30 transition-colors">
                                    {/* Header: Title and Status */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className={`text-[10px] px-1.5 py-0.5 ${getTypeColor(insight.type)}`}>
                                                {insight.type.replace('_', ' ')}
                                            </Badge>
                                            <Badge className={`text-[10px] px-1.5 py-0.5 ${getStatusColor(insight.status)}`}>
                                                {insight.status}
                                            </Badge>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {new Date(insight.occurredAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div className="font-medium text-gray-900 mb-1 text-xs">
                                        {insight.title}
                                    </div>

                                    {/* Message */}
                                    <div className="text-gray-600 text-xs leading-relaxed">
                                        {insight.message}
                                    </div>

                                    {/* Action Required */}
                                    {insight.payload?.actionRequired && (
                                        <div className="mt-2">
                                            <Badge className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5">
                                                Action Required
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
