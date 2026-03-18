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
const verification_service_1 = require("../../../modules/verification/verification.service");
const verification_repository_1 = require("../../../modules/verification/verification.repository");
const constants_1 = require("../../core/constants");
(0, node_test_1.describe)('VerificationService (Phase 3)', () => {
    let service;
    let repository;
    let mockPrisma;
    let mockLoader;
    let prismaCalls = [];
    (0, node_test_1.beforeEach)(() => {
        prismaCalls = [];
        mockPrisma = {
            metric: {
                count: async (args) => {
                    prismaCalls.push({ method: 'count', args });
                    return 100;
                },
                groupBy: async (args) => {
                    prismaCalls.push({ method: 'groupBy', args });
                    return [];
                }
            }
        };
        mockLoader = {
            load: async (id) => ({
                scenarioId: id,
                days: 30,
            })
        };
        const mockEvaluator = {
            evaluate: () => []
        };
        repository = new verification_repository_1.VerificationRepository(mockPrisma);
        service = new verification_service_1.VerificationService(repository, mockLoader, mockEvaluator);
    });
    (0, node_test_1.test)('T9: Should enforce strict mock-only filters in repository calls', async () => {
        await service.verifyScenario({
            scenarioId: 'test-scenario',
            tenantId: 'tenant-1'
        });
        const countCalls = prismaCalls.filter(c => c.method === 'count');
        assert.ok(countCalls.length >= 3, 'Should call count for INT-003, INT-004, INT-001');
        for (const call of countCalls) {
            const where = call.args.where;
            if (where.isMockData === false) {
                assert.deepStrictEqual(where.source, { startsWith: 'toolkit:' });
            }
            else {
                assert.strictEqual(where.isMockData, true, 'Must filter by isMockData: true');
                assert.deepStrictEqual(where.source, { startsWith: 'toolkit:' }, 'Must filter by toolkit source');
            }
        }
    });
    (0, node_test_1.test)('T3: Should check for drift outside defined window', async () => {
        const fixedAnchor = new Date('2024-01-01T00:00:00Z');
        mockLoader.load = async (id) => ({
            scenarioId: id,
            days: 30,
            dateAnchor: fixedAnchor.toISOString()
        });
        await service.verifyScenario({
            scenarioId: 'test-scenario',
            tenantId: 'tenant-1'
        });
        const driftCall = prismaCalls.find(c => c.args.where.NOT && c.args.where.NOT.date);
        assert.ok(driftCall, 'Should perform drift check');
        const dateFilter = driftCall.args.where.NOT.date;
        const expectedEnd = fixedAnchor;
        const expectedStart = new Date(fixedAnchor);
        expectedStart.setDate(expectedStart.getDate() - 30);
        assert.deepStrictEqual(dateFilter.gte, expectedStart);
        assert.deepStrictEqual(dateFilter.lte, expectedEnd);
    });
    (0, node_test_1.test)('T2: Should not call any write methods', async () => {
        await service.verifyScenario({
            scenarioId: 'test-scenario',
            tenantId: 'tenant-1'
        });
        const writeMethods = ['create', 'update', 'delete', 'upsert', 'createMany', 'deleteMany'];
        const calls = prismaCalls.filter(c => writeMethods.includes(c.method));
        assert.strictEqual(calls.length, 0, 'Must not perform any DB writes');
    });
    (0, node_test_1.test)('T3b: Should use deterministic anchor when scenario does not provide dateAnchor', async () => {
        await service.verifyScenario({
            scenarioId: 'test-scenario',
            tenantId: 'tenant-1'
        });
        const driftCall = prismaCalls.find(c => c.args.where.NOT && c.args.where.NOT.date);
        assert.ok(driftCall, 'Should perform drift check');
        const dateFilter = driftCall.args.where.NOT.date;
        const expectedEnd = new Date(constants_1.DETERMINISTIC_ANCHOR);
        const expectedStart = new Date(expectedEnd);
        expectedStart.setDate(expectedStart.getDate() - 30);
        assert.deepStrictEqual(dateFilter.gte, expectedStart);
        assert.deepStrictEqual(dateFilter.lte, expectedEnd);
    });
});
//# sourceMappingURL=verification.test.js.map