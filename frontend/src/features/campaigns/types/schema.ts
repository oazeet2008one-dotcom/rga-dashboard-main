// Import from zod/v3 for compatibility with @hookform/resolvers
import { z } from 'zod/v3';

/**
 * Zod Validation Schema for Creating a Campaign
 * Uses z.coerce for form inputs that come as strings
 * 
 * NOTE: Using zod/v3 import for compatibility with @hookform/resolvers
 * which currently requires Zod v3 API
 */
export const createCampaignSchema = z.object({
    // Campaign name - required, minimum 1 character
    name: z
        .string()
        .min(1, { message: 'Campaign name is required' })
        .max(100, { message: 'Campaign name must be less than 100 characters' }),

    // Platform selection - required enum
    platform: z.enum(['facebook', 'google', 'tiktok'], {
        required_error: 'Please select a platform',
    }),

    // Status selection - required enum
    status: z.enum(['active', 'draft', 'paused'], {
        required_error: 'Please select a status',
    }),

    // Budget - coerce string to number, minimum 1
    budget: z.coerce
        .number({
            required_error: 'Budget is required',
            invalid_type_error: 'Budget must be a number',
        })
        .min(1, { message: 'Budget must be at least ฿1' })
        .max(10000000, { message: 'Budget cannot exceed ฿10,000,000' }),

    // Start Date - required
    startDate: z.date({
        required_error: 'Start date is required',
    }),

    // End Date - optional
    endDate: z.date().optional(),
}).refine(
    (data) => {
        // If endDate is provided, it must be after startDate
        if (data.endDate && data.startDate) {
            return data.endDate > data.startDate;
        }
        return true;
    },
    {
        message: 'End date must be after start date',
        path: ['endDate'],
    }
);

// Inferred type from schema
export type CreateCampaignFormData = z.infer<typeof createCampaignSchema>;

// Default form values
export const defaultCampaignValues: Partial<CreateCampaignFormData> = {
    name: '',
    platform: undefined,
    status: 'draft',
    budget: undefined,
    startDate: undefined,
    endDate: undefined,
};
