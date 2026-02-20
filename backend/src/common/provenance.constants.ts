import { Prisma } from '@prisma/client';

export enum ProvenanceMode {
    REAL = 'REAL',
    MOCK = 'MOCK',
    ALL = 'ALL',
}

export const PROVENANCE = {
    // Sources
    SOURCE_TOOLKIT_SEED: 'toolkit:seed-data',
    SOURCE_TOOLKIT_GADS: 'toolkit:google-ads-seeder',
    SOURCE_INTEGRATION_PREFIX: 'integration:',
    SOURCE_REMEDIATED_TOOLKIT: 'remediated-v1b-toolkit',

    // Filters
    REAL_DATA_FILTER: { isMockData: false } satisfies Prisma.MetricWhereInput,
    MOCK_DATA_FILTER: { isMockData: true } satisfies Prisma.MetricWhereInput,
};

export function parseProvenanceMode(value?: string): ProvenanceMode {
    if (!value) return ProvenanceMode.REAL;

    const normalized = value.toUpperCase();
    if (normalized === ProvenanceMode.REAL) return ProvenanceMode.REAL;
    if (normalized === ProvenanceMode.MOCK) return ProvenanceMode.MOCK;
    if (normalized === ProvenanceMode.ALL) return ProvenanceMode.ALL;

    throw new Error(`Invalid provenance mode "${value}". Expected one of: REAL, MOCK, ALL.`);
}

export function getMetricProvenanceFilter(mode: ProvenanceMode): Prisma.MetricWhereInput {
    if (mode === ProvenanceMode.MOCK) return PROVENANCE.MOCK_DATA_FILTER;
    if (mode === ProvenanceMode.ALL) return {};
    return PROVENANCE.REAL_DATA_FILTER;
}

export function getCampaignProvenanceFilter(mode: ProvenanceMode): Prisma.CampaignWhereInput {
    const mockCampaignExternalIdFilter: Prisma.CampaignWhereInput = {
        OR: [
            { externalId: { startsWith: 'toolkit-seed-' } },
            { externalId: { startsWith: 'unified-' } },
        ],
    };

    if (mode === ProvenanceMode.MOCK) return mockCampaignExternalIdFilter;
    if (mode === ProvenanceMode.ALL) return {};
    return { NOT: mockCampaignExternalIdFilter };
}
