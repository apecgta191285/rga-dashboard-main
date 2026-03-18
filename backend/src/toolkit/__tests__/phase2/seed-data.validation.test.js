"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const seed_data_command_1 = require("../../commands/seed-data.command");
const platform_types_1 = require("../../domain/platform.types");
const mockLogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
    child: () => mockLogger,
};
const mockPrisma = {
    campaign: { findFirst: async () => null, create: async () => ({ id: 'camp-1' }) },
    metric: { create: async () => ({}) },
};
const mockSeeder = {
    seed: async () => ({ success: true, status: 'completed', message: 'ok', data: { seededCount: 0 } }),
};
(0, node_test_1.describe)('SeedDataCommand validation', () => {
    (0, node_test_1.test)('returns failure for unsupported platform', () => {
        const handler = new seed_data_command_1.SeedDataCommandHandler(mockLogger, mockPrisma, mockSeeder);
        const command = new seed_data_command_1.SeedDataCommand({
            platform: 'INVALID',
            days: 30,
            trend: 'GROWTH',
            injectAnomaly: false,
        });
        const result = handler.validate(command);
        assert.strictEqual(result.kind, 'failure');
    });
    (0, node_test_1.test)('returns failure for invalid days', () => {
        const handler = new seed_data_command_1.SeedDataCommandHandler(mockLogger, mockPrisma, mockSeeder);
        const command = new seed_data_command_1.SeedDataCommand({
            platform: platform_types_1.ToolkitPlatform.GoogleAds,
            days: 0,
            trend: 'GROWTH',
            injectAnomaly: false,
        });
        const result = handler.validate(command);
        assert.strictEqual(result.kind, 'failure');
    });
    (0, node_test_1.test)('accepts upper bound days of 365', () => {
        const handler = new seed_data_command_1.SeedDataCommandHandler(mockLogger, mockPrisma, mockSeeder);
        const command = new seed_data_command_1.SeedDataCommand({
            platform: platform_types_1.ToolkitPlatform.GoogleAds,
            days: 365,
            trend: 'GROWTH',
            injectAnomaly: false,
        });
        const result = handler.validate(command);
        assert.strictEqual(result.kind, 'success');
    });
});
//# sourceMappingURL=seed-data.validation.test.js.map