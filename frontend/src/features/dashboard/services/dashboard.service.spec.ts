// src/features/dashboard/services/dashboard.service.spec.ts
// =============================================================================
// Unit Tests for Dashboard Service - Vitest
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { getDashboardOverview } from './dashboard.service';
import { apiClient } from '@/services/api-client';
import type { DashboardOverviewData } from '../schemas';

// Mock the api-client module
vi.mock('@/services/api-client', () => ({
    apiClient: {
        get: vi.fn(),
    },
}));

// =============================================================================
// Test Fixtures
// =============================================================================

const mockValidResponse: DashboardOverviewData = {
    summary: {
        totalImpressions: 455000,
        totalClicks: 18500,
        totalCost: 42500.0,
        totalConversions: 625,
        averageCtr: 4.07,
        averageRoas: 3.85,
    },
    growth: {
        impressionsGrowth: 12.5,
        clicksGrowth: 8.3,
        costGrowth: -5.2,
        conversionsGrowth: 15.7,
    },
    trends: [
        {
            date: '2026-01-15',
            impressions: 65000,
            clicks: 2650,
            cost: 6100.0,
            conversions: 95,
        },
        {
            date: '2026-01-14',
            impressions: 68000,
            clicks: 2750,
            cost: 6250.0,
            conversions: 88,
        },
    ],
    recentCampaigns: [
        {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Summer Sale 2026',
            status: 'ACTIVE',
            platform: 'GOOGLE_ADS',
            spending: 28500.0,
            budgetUtilization: 57.0,
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Brand Awareness Q1',
            status: 'ACTIVE',
            platform: 'FACEBOOK',
            spending: 14000.0,
            budgetUtilization: 46.7,
        },
    ],
};

// =============================================================================
// Tests
// =============================================================================

describe('Dashboard Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('getDashboardOverview', () => {
        it('should fetch and validate dashboard overview data', async () => {
            // Arrange
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                data: mockValidResponse,
            });

            // Act
            const result = await getDashboardOverview({ period: '7d' });

            // Assert
            expect(apiClient.get).toHaveBeenCalledWith('/dashboard/overview', {
                params: { period: '7d' },
            });
            expect(result).toEqual(mockValidResponse);
            expect(result.summary.totalImpressions).toBe(455000);
            expect(result.trends).toHaveLength(2);
            expect(result.recentCampaigns[0].status).toBe('ACTIVE');
        });

        it('should use default period when not specified', async () => {
            // Arrange
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                data: mockValidResponse,
            });

            // Act
            await getDashboardOverview();

            // Assert
            expect(apiClient.get).toHaveBeenCalledWith('/dashboard/overview', {
                params: { period: '7d' },
            });
        });

        it('should include tenantId when provided', async () => {
            // Arrange
            const tenantId = '550e8400-e29b-41d4-a716-446655440000';
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                data: mockValidResponse,
            });

            // Act
            await getDashboardOverview({ period: '30d', tenantId });

            // Assert
            expect(apiClient.get).toHaveBeenCalledWith('/dashboard/overview', {
                params: { period: '30d', tenantId },
            });
        });

        it('should throw ZodError for invalid summary structure', async () => {
            // Arrange: Missing required field
            const invalidResponse = {
                ...mockValidResponse,
                summary: {
                    totalImpressions: 455000,
                    // missing: totalClicks, totalCost, etc.
                },
            };
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                data: invalidResponse,
            });

            // Act & Assert
            await expect(getDashboardOverview()).rejects.toThrow(ZodError);
        });

        it('should throw ZodError for invalid campaign status', async () => {
            // Arrange: Invalid enum value
            const invalidResponse = {
                ...mockValidResponse,
                recentCampaigns: [
                    {
                        ...mockValidResponse.recentCampaigns[0],
                        status: 'INVALID_STATUS', // Not in enum
                    },
                ],
            };
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                data: invalidResponse,
            });

            // Act & Assert
            await expect(getDashboardOverview()).rejects.toThrow(ZodError);
        });

        it('should throw ZodError for invalid date format in trends', async () => {
            // Arrange: Invalid date format
            const invalidResponse = {
                ...mockValidResponse,
                trends: [
                    {
                        date: '15-01-2026', // Wrong format (DD-MM-YYYY instead of YYYY-MM-DD)
                        impressions: 65000,
                        clicks: 2650,
                        cost: 6100.0,
                        conversions: 95,
                    },
                ],
            };
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                data: invalidResponse,
            });

            // Act & Assert
            await expect(getDashboardOverview()).rejects.toThrow(ZodError);
        });

        it('should throw ZodError for extra unknown fields (strict mode)', async () => {
            // Arrange: Extra field not in schema
            const invalidResponse = {
                ...mockValidResponse,
                unknownField: 'should not be here',
            };
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                data: invalidResponse,
            });

            // Act & Assert
            await expect(getDashboardOverview()).rejects.toThrow(ZodError);
        });

        it('should accept null growth values', async () => {
            // Arrange: Null growth is valid (no previous data)
            const responseWithNullGrowth = {
                ...mockValidResponse,
                growth: {
                    impressionsGrowth: null,
                    clicksGrowth: null,
                    costGrowth: null,
                    conversionsGrowth: null,
                },
            };
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                data: responseWithNullGrowth,
            });

            // Act
            const result = await getDashboardOverview();

            // Assert
            expect(result.growth.impressionsGrowth).toBeNull();
            expect(result.growth.clicksGrowth).toBeNull();
        });

        it('should accept optional budgetUtilization in campaigns', async () => {
            // Arrange: Campaign without budgetUtilization
            const responseWithoutBudget = {
                ...mockValidResponse,
                recentCampaigns: [
                    {
                        id: '550e8400-e29b-41d4-a716-446655440001',
                        name: 'Campaign Without Budget',
                        status: 'PENDING',
                        platform: 'TIKTOK',
                        spending: 0,
                        // No budgetUtilization
                    },
                ],
            };
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                data: responseWithoutBudget,
            });

            // Act
            const result = await getDashboardOverview();

            // Assert
            expect(result.recentCampaigns[0].budgetUtilization).toBeUndefined();
        });

        it('should propagate network errors from apiClient', async () => {
            // Arrange
            const networkError = new Error('Network Error');
            vi.mocked(apiClient.get).mockRejectedValueOnce(networkError);

            // Act & Assert
            await expect(getDashboardOverview()).rejects.toThrow('Network Error');
        });
    });
});
