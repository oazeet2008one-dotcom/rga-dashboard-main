import { PeriodEnum } from '../../modules/dashboard/dto/dashboard-overview.dto';

export class DateRangeUtil {
    /**
     * Get date range based on PeriodEnum (supports 7d, 30d, this_month, last_month)
     */
    static getDateRangeByPeriod(period: PeriodEnum): { startDate: Date; endDate: Date } {
        const now = new Date();

        switch (period) {
            case PeriodEnum.THIS_MONTH: {
                // First day of current month to today
                const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
                const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
                return { startDate, endDate };
            }
            case PeriodEnum.LAST_MONTH: {
                // First to last day of previous month
                const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0));
                const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999));
                return { startDate, endDate };
            }
            case PeriodEnum.THIRTY_DAYS:
                return this.getDateRange(30);
            case PeriodEnum.SEVEN_DAYS:
            default:
                return this.getDateRange(7);
        }
    }

    /**
     * Get previous period date range for growth comparison
     * Matches the same duration as the current period
     */
    static getPreviousPeriodByPeriod(period: PeriodEnum, currentStartDate: Date, currentEndDate: Date): { startDate: Date; endDate: Date } {
        const duration = Math.ceil((currentEndDate.getTime() - currentStartDate.getTime()) / (1000 * 60 * 60 * 24));

        const endDate = new Date(currentStartDate);
        endDate.setUTCDate(endDate.getUTCDate() - 1);
        endDate.setUTCHours(23, 59, 59, 999);

        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - duration + 1);
        startDate.setUTCHours(0, 0, 0, 0);

        return { startDate, endDate };
    }

    /**
     * Parse period string to number of days
     */
    static parsePeriodDays(period: string): number {
        const match = period.match(/^(\d+)d$/);
        if (match) {
            return parseInt(match[1], 10);
        }
        // Fallback defaults
        if (period === '7d') return 7;
        if (period === '14d') return 14;
        if (period === '30d') return 30;
        if (period === '90d') return 90;
        return 7;
    }

    /**
     * Get start and end dates for a given number of days
     * Uses UTC dates for consistent Prisma/PostgreSQL matching
     */
    static getDateRange(days: number): { startDate: Date; endDate: Date } {
        const now = new Date();
        const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

        const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
        startDate.setUTCDate(startDate.getUTCDate() - days);

        return { startDate, endDate };
    }

    /**
     * Get previous period date range for comparison
     */
    static getPreviousPeriodDateRange(currentStartDate: Date, days: number): { startDate: Date; endDate: Date } {
        const endDate = new Date(currentStartDate);
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date(currentStartDate);
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        return { startDate, endDate };
    }
}
