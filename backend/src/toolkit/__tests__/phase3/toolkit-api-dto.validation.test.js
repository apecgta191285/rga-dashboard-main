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
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const dto_1 = require("../../api/dto");
async function validateDto(dtoClass, payload) {
    const instance = (0, class_transformer_1.plainToInstance)(dtoClass, payload);
    const errors = await (0, class_validator_1.validate)(instance);
    return { instance, errors };
}
(0, node_test_1.describe)('Toolkit API DTO validation', () => {
    (0, node_test_1.test)('AlertScenarioDto should transform and validate boolean/number fields', async () => {
        const { instance, errors } = await validateDto(dto_1.AlertScenarioDto, {
            tenantId: 'tenant-1',
            seedBaseline: 'false',
            injectAnomaly: 'true',
            days: '14',
            dryRun: 'true',
            confirmWrite: 'false',
        });
        assert.strictEqual(errors.length, 0);
        assert.strictEqual(instance.seedBaseline, false);
        assert.strictEqual(instance.injectAnomaly, true);
        assert.strictEqual(instance.days, 14);
    });
    (0, node_test_1.test)('AlertScenarioDto should reject out-of-range days', async () => {
        const { errors } = await validateDto(dto_1.AlertScenarioDto, {
            tenantId: 'tenant-1',
            days: 366,
        });
        assert.ok(errors.some((error) => error.property === 'days'));
    });
    (0, node_test_1.test)('AlertScenarioDto should require confirmWrite=true when dryRun=false', async () => {
        const { errors } = await validateDto(dto_1.AlertScenarioDto, {
            tenantId: 'tenant-1',
            dryRun: false,
            confirmWrite: false,
        });
        assert.ok(errors.some((error) => error.property === 'confirmWrite'));
    });
    (0, node_test_1.test)('ResetTenantDto should require confirmWrite=true when dryRun=false', async () => {
        const { errors } = await validateDto(dto_1.ResetTenantDto, {
            tenantId: 'tenant-1',
            dryRun: false,
            confirmWrite: false,
        });
        assert.ok(errors.some((error) => error.property === 'confirmWrite'));
    });
    (0, node_test_1.test)('ResetTenantHardDto should require HARD_RESET ack and valid ISO datetime', async () => {
        const { errors } = await validateDto(dto_1.ResetTenantHardDto, {
            tenantId: 'tenant-1',
            confirmationToken: 'RTH.token.secret',
            confirmedAt: 'not-a-date',
            destructiveAck: 'WRONG_ACK',
            dryRun: false,
            confirmWrite: false,
        });
        assert.ok(errors.some((error) => error.property === 'confirmedAt'));
        assert.ok(errors.some((error) => error.property === 'destructiveAck'));
        assert.ok(errors.some((error) => error.property === 'confirmWrite'));
    });
    (0, node_test_1.test)('GetMetricsQueryDto should enforce tenantId and limit bounds', async () => {
        const { errors } = await validateDto(dto_1.GetMetricsQueryDto, {
            tenantId: '',
            limit: 6000,
        });
        assert.ok(errors.some((error) => error.property === 'tenantId'));
        assert.ok(errors.some((error) => error.property === 'limit'));
    });
    (0, node_test_1.test)('GetMetricsQueryDto should reject endDate earlier than startDate', async () => {
        const { errors } = await validateDto(dto_1.GetMetricsQueryDto, {
            tenantId: 'tenant-1',
            startDate: '2025-02-10',
            endDate: '2025-02-01',
        });
        assert.ok(errors.some((error) => error.property === 'endDate'));
    });
    (0, node_test_1.test)('GetAlertHistoryQueryDto should apply default limit when omitted', async () => {
        const { instance, errors } = await validateDto(dto_1.GetAlertHistoryQueryDto, {
            tenantId: 'tenant-1',
        });
        assert.strictEqual(errors.length, 0);
        assert.strictEqual(instance.limit, 100);
    });
    (0, node_test_1.test)('GetAlertsQueryDto should reject unsupported status value', async () => {
        const { errors } = await validateDto(dto_1.GetAlertsQueryDto, {
            tenantId: 'tenant-1',
            status: 'INVALID_STATUS',
        });
        assert.ok(errors.some((error) => error.property === 'status'));
    });
});
//# sourceMappingURL=toolkit-api-dto.validation.test.js.map