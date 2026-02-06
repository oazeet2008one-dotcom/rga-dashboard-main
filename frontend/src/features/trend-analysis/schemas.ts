import { z } from 'zod';

export const PeriodEnumSchema = z.enum([
    '7d',
    '30d',
    'this_month',
    'last_month',
    'custom',
]);
export type PeriodEnum = z.infer<typeof PeriodEnumSchema>;

export const TrendDataPointSchema = z
    .object({
        date: z.string().regex(/^(\d{4})-(\d{2})-(\d{2})$/, 'Invalid date format'),
        impressions: z.number().int().nonnegative(),
        clicks: z.number().int().nonnegative(),
        cost: z.number().nonnegative(),
        conversions: z.number().int().nonnegative(),
    })
    .strict();

export type TrendDataPoint = z.infer<typeof TrendDataPointSchema>;

export const TrendAnalysisDataSchema = z
    .object({
        trends: z.array(TrendDataPointSchema),
    })
    .passthrough();

export type TrendAnalysisData = z.infer<typeof TrendAnalysisDataSchema>;

export const TrendAnalysisQuerySchema = z.object({
    period: PeriodEnumSchema.optional(),
    startDate: z.string().regex(/^(\d{4})-(\d{2})-(\d{2})$/).optional(),
    endDate: z.string().regex(/^(\d{4})-(\d{2})-(\d{2})$/).optional(),
    tenantId: z.string().uuid().optional(),
});

export type TrendAnalysisQuery = z.infer<typeof TrendAnalysisQuerySchema>;
