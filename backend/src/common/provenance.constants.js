"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVENANCE = exports.ProvenanceMode = void 0;
exports.parseProvenanceMode = parseProvenanceMode;
exports.getMetricProvenanceFilter = getMetricProvenanceFilter;
exports.getCampaignProvenanceFilter = getCampaignProvenanceFilter;
var ProvenanceMode;
(function (ProvenanceMode) {
    ProvenanceMode["REAL"] = "REAL";
    ProvenanceMode["MOCK"] = "MOCK";
    ProvenanceMode["ALL"] = "ALL";
})(ProvenanceMode || (exports.ProvenanceMode = ProvenanceMode = {}));
exports.PROVENANCE = {
    SOURCE_TOOLKIT_SEED: 'toolkit:seed-data',
    SOURCE_TOOLKIT_GADS: 'toolkit:google-ads-seeder',
    SOURCE_INTEGRATION_PREFIX: 'integration:',
    SOURCE_REMEDIATED_TOOLKIT: 'remediated-v1b-toolkit',
    REAL_DATA_FILTER: { isMockData: false },
    MOCK_DATA_FILTER: { isMockData: true },
};
function parseProvenanceMode(value) {
    if (!value)
        return ProvenanceMode.REAL;
    const normalized = value.toUpperCase();
    if (normalized === ProvenanceMode.REAL)
        return ProvenanceMode.REAL;
    if (normalized === ProvenanceMode.MOCK)
        return ProvenanceMode.MOCK;
    if (normalized === ProvenanceMode.ALL)
        return ProvenanceMode.ALL;
    throw new Error(`Invalid provenance mode "${value}". Expected one of: REAL, MOCK, ALL.`);
}
function getMetricProvenanceFilter(mode) {
    if (mode === ProvenanceMode.MOCK)
        return exports.PROVENANCE.MOCK_DATA_FILTER;
    if (mode === ProvenanceMode.ALL)
        return {};
    return exports.PROVENANCE.REAL_DATA_FILTER;
}
function getCampaignProvenanceFilter(mode) {
    const mockCampaignExternalIdFilter = {
        OR: [
            { externalId: { startsWith: 'toolkit-seed-' } },
            { externalId: { startsWith: 'unified-' } },
        ],
    };
    if (mode === ProvenanceMode.MOCK)
        return mockCampaignExternalIdFilter;
    if (mode === ProvenanceMode.ALL)
        return {};
    return { NOT: mockCampaignExternalIdFilter };
}
//# sourceMappingURL=provenance.constants.js.map