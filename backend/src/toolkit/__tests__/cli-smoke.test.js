"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const seed_unified_ui_1 = require("../commands/ui/seed-unified.ui");
const verify_scenario_ui_1 = require("../commands/ui/verify-scenario.ui");
const seed_data_ui_1 = require("../commands/ui/seed-data.ui");
const seed_google_ads_ui_1 = require("../commands/ui/seed-google-ads.ui");
const alert_scenario_ui_1 = require("../commands/ui/alert-scenario.ui");
const reset_tenant_ui_1 = require("../commands/ui/reset-tenant.ui");
const reset_tenant_hard_ui_1 = require("../commands/ui/reset-tenant-hard.ui");
(0, node_test_1.describe)('CLI Components Smoke Test', () => {
    (0, node_test_1.it)('should successfully import all UI command handlers', () => {
        node_assert_1.default.ok(seed_unified_ui_1.SeedUnifiedUi, 'SeedUnifiedUi should be defined');
        node_assert_1.default.ok(verify_scenario_ui_1.VerifyScenarioUi, 'VerifyScenarioUi should be defined');
        node_assert_1.default.ok(seed_data_ui_1.SeedDataUi, 'SeedDataUi should be defined');
        node_assert_1.default.ok(seed_google_ads_ui_1.SeedGoogleAdsUi, 'SeedGoogleAdsUi should be defined');
        node_assert_1.default.ok(alert_scenario_ui_1.AlertScenarioUi, 'AlertScenarioUi should be defined');
        node_assert_1.default.ok(reset_tenant_ui_1.ResetTenantUi, 'ResetTenantUi should be defined');
        node_assert_1.default.ok(reset_tenant_hard_ui_1.ResetTenantHardUi, 'ResetTenantHardUi should be defined');
    });
    (0, node_test_1.it)('should instantiate UI handlers', () => {
        const ui = new seed_unified_ui_1.SeedUnifiedUi();
        node_assert_1.default.strictEqual(ui.name, 'seed-unified-scenario');
    });
});
//# sourceMappingURL=cli-smoke.test.js.map