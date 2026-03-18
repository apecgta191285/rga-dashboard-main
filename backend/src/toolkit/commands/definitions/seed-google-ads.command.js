"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEED_GOOGLE_ADS_COMMAND = void 0;
exports.createSeedGoogleAdsCommand = createSeedGoogleAdsCommand;
exports.SEED_GOOGLE_ADS_COMMAND = 'seed-google-ads';
function createSeedGoogleAdsCommand(tenantId, days = 30) {
    return {
        name: exports.SEED_GOOGLE_ADS_COMMAND,
        description: 'Seed 30 days of historical Google Ads data',
        requiresConfirmation: false,
        tenantId,
        days,
    };
}
//# sourceMappingURL=seed-google-ads.command.js.map