import { apiClient } from '@/services/api-client';
import {
    TrendAnalysisDataSchema,
    type TrendAnalysisData,
    type TrendAnalysisQuery,
} from '../schemas';

const TREND_ANALYSIS_ENDPOINT = '/dashboard/overview';

export async function getTrendAnalysisData(
    params: TrendAnalysisQuery = {}
): Promise<TrendAnalysisData> {
    const { period = '7d', tenantId, startDate, endDate } = params;

    const response = await apiClient.get<TrendAnalysisData>(
        TREND_ANALYSIS_ENDPOINT,
        {
            params: {
                period,
                ...(tenantId && { tenantId }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
            },
        }
    );

    return TrendAnalysisDataSchema.parse(response.data);
}

export const trendAnalysisService = {
    getTrendAnalysisData,
} as const;

export default trendAnalysisService;
