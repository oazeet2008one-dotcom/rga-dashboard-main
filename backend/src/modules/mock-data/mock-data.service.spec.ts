import { MockDataService } from './mock-data.service';
import { PeriodEnum } from '../dashboard/dto/dashboard-overview.dto';

describe('MockDataService', () => {
    let service: MockDataService;

    beforeEach(() => {
        service = new MockDataService();
    });

    describe('getMockOverview', () => {
        it('should return recentCampaigns with UUID ids (contract)', () => {
            const result = service.getMockOverview(PeriodEnum.SEVEN_DAYS);

            expect(Array.isArray(result.recentCampaigns)).toBe(true);
            expect(result.recentCampaigns.length).toBeGreaterThan(0);

            for (const campaign of result.recentCampaigns) {
                expect(campaign.id).toMatch(
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                );
            }
        });

        it('should generate stable UUIDs for known mock campaigns', () => {
            const a = service.getMockOverview(PeriodEnum.SEVEN_DAYS);
            const b = service.getMockOverview(PeriodEnum.SEVEN_DAYS);

            expect(a.recentCampaigns.map((c) => c.id)).toEqual(
                b.recentCampaigns.map((c) => c.id),
            );
        });
    });
});
