import { Prisma } from '@prisma/client';
export declare enum ProvenanceMode {
    REAL = "REAL",
    MOCK = "MOCK",
    ALL = "ALL"
}
export declare const PROVENANCE: {
    SOURCE_TOOLKIT_SEED: string;
    SOURCE_TOOLKIT_GADS: string;
    SOURCE_INTEGRATION_PREFIX: string;
    SOURCE_REMEDIATED_TOOLKIT: string;
    REAL_DATA_FILTER: {
        isMockData: false;
    };
    MOCK_DATA_FILTER: {
        isMockData: true;
    };
};
export declare function parseProvenanceMode(value?: string): ProvenanceMode;
export declare function getMetricProvenanceFilter(mode: ProvenanceMode): Prisma.MetricWhereInput;
export declare function getCampaignProvenanceFilter(mode: ProvenanceMode): Prisma.CampaignWhereInput;
