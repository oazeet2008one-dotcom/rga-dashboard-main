import { ecommerceService } from '@/services/ecommerce-service';

export const EcommerceApi = {
    getSummary: (period: string = '30d') => ecommerceService.getSummary(period),
    getTrends: (days: number = 30) => ecommerceService.getTrends(days),
    backfill: (days: number = 30) => ecommerceService.backfill(days),
};
