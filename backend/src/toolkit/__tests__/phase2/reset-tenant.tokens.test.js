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
const tenant_reset_service_1 = require("../../services/tenant-reset.service");
function createService() {
    const txClient = {
        metric: { deleteMany: async () => ({ count: 10 }) },
        alert: { deleteMany: async () => ({ count: 2 }) },
        alertHistory: { deleteMany: async () => ({ count: 3 }) },
        alertRule: { deleteMany: async () => ({ count: 1 }) },
        campaign: { deleteMany: async () => ({ count: 4 }) },
    };
    const prisma = {
        tenant: {
            findUnique: async ({ where }) => {
                if (where.id === 'tenant-a' || where.id === 'tenant-b') {
                    return { id: where.id, name: where.id };
                }
                return null;
            },
        },
        $transaction: async (callback) => callback(txClient),
    };
    return new tenant_reset_service_1.TenantResetService(prisma);
}
(0, node_test_1.describe)('TenantResetService hard reset confirmation tokens', () => {
    (0, node_test_1.test)('accepts server-issued token once, then rejects replay', async () => {
        const service = createService();
        const issued = service.generateConfirmationToken('tenant-a');
        const first = await service.hardReset('tenant-a', {
            mode: 'HARD',
            confirmationToken: issued.token,
            confirmedAt: new Date(),
        });
        assert.strictEqual(first.success, true);
        const replay = await service.hardReset('tenant-a', {
            mode: 'HARD',
            confirmationToken: issued.token,
            confirmedAt: new Date(),
        });
        assert.strictEqual(replay.success, false);
        assert.ok((replay.error || '').includes('already used'));
    });
    (0, node_test_1.test)('rejects forged token even when format looks valid', async () => {
        const service = createService();
        const result = await service.hardReset('tenant-a', {
            mode: 'HARD',
            confirmationToken: 'RTH.fake-id.fake-secret',
            confirmedAt: new Date(),
        });
        assert.strictEqual(result.success, false);
        assert.ok((result.error || '').includes('unknown') || (result.error || '').includes('Invalid'));
    });
    (0, node_test_1.test)('rejects token used for a different tenant', async () => {
        const service = createService();
        const issued = service.generateConfirmationToken('tenant-a');
        const result = await service.hardReset('tenant-b', {
            mode: 'HARD',
            confirmationToken: issued.token,
            confirmedAt: new Date(),
        });
        assert.strictEqual(result.success, false);
        assert.ok((result.error || '').includes('tenant mismatch'));
    });
});
//# sourceMappingURL=reset-tenant.tokens.test.js.map