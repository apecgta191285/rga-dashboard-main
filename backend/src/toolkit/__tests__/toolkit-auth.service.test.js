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
const node_assert_1 = require("node:assert");
const jwt = __importStar(require("jsonwebtoken"));
const toolkit_auth_service_1 = require("../toolkit-auth.service");
const mockPrisma = {
    user: {
        findFirst: node_test_1.mock.fn(),
        create: node_test_1.mock.fn(),
    },
    tenant: {
        findUnique: node_test_1.mock.fn(),
    },
    $disconnect: node_test_1.mock.fn(),
};
(0, node_test_1.describe)('ToolkitAuthService', () => {
    let service;
    const originalEnv = process.env;
    (0, node_test_1.beforeEach)(() => {
        mockPrisma.user.findFirst.mock.resetCalls();
        mockPrisma.user.create.mock.resetCalls();
        mockPrisma.tenant.findUnique.mock.resetCalls();
        mockPrisma.$disconnect.mock.resetCalls();
        process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };
        service = new toolkit_auth_service_1.ToolkitAuthService(mockPrisma);
    });
    (0, node_test_1.afterEach)(() => {
        process.env = originalEnv;
    });
    (0, node_test_1.it)('getOrCreateAdmin returns existing user if found', async () => {
        const existingUser = { id: 'user-1', email: 'test@example.com', role: 'ADMIN' };
        mockPrisma.user.findFirst.mock.mockImplementation(async () => existingUser);
        const result = await service.getOrCreateAdmin('tenant-1');
        node_assert_1.strict.deepStrictEqual(result, existingUser);
        node_assert_1.strict.strictEqual(mockPrisma.user.findFirst.mock.callCount(), 1);
        node_assert_1.strict.strictEqual(mockPrisma.user.create.mock.callCount(), 0);
    });
    (0, node_test_1.it)('getOrCreateAdmin creates new user if not found and tenant exists', async () => {
        mockPrisma.user.findFirst.mock.mockImplementation(async () => null);
        mockPrisma.tenant.findUnique.mock.mockImplementation(async () => ({ id: 'tenant-1' }));
        const newUser = { id: 'user-new', email: 'toolkit-admin@tenant-1.local', role: 'ADMIN' };
        mockPrisma.user.create.mock.mockImplementation(async () => newUser);
        const result = await service.getOrCreateAdmin('tenant-1');
        node_assert_1.strict.deepStrictEqual(result, newUser);
        node_assert_1.strict.strictEqual(mockPrisma.user.findFirst.mock.callCount(), 1);
        node_assert_1.strict.strictEqual(mockPrisma.tenant.findUnique.mock.callCount(), 1);
        node_assert_1.strict.strictEqual(mockPrisma.user.create.mock.callCount(), 1);
        const createArgs = mockPrisma.user.create.mock.calls[0].arguments[0];
        node_assert_1.strict.strictEqual(createArgs.data.tenantId, 'tenant-1');
        node_assert_1.strict.strictEqual(createArgs.data.role, 'ADMIN');
    });
    (0, node_test_1.it)('getOrCreateAdmin throws if tenant does not exist', async () => {
        mockPrisma.user.findFirst.mock.mockImplementation(async () => null);
        mockPrisma.tenant.findUnique.mock.mockImplementation(async () => null);
        await node_assert_1.strict.rejects(async () => {
            await service.getOrCreateAdmin('tenant-missing');
        }, /Tenant not found: tenant-missing/);
        node_assert_1.strict.strictEqual(mockPrisma.user.create.mock.callCount(), 0);
    });
    (0, node_test_1.it)('generateImpersonationToken throws if JWT_SECRET is missing', () => {
        delete process.env.JWT_SECRET;
        node_assert_1.strict.throws(() => {
            service.generateImpersonationToken({ id: '1', email: 'a@b.com' }, 't1');
        }, /Missing JWT_SECRET/);
    });
    (0, node_test_1.it)('generateImpersonationToken returns valid JWT', () => {
        const user = { id: 'u1', email: 'test@example.com' };
        const token = service.generateImpersonationToken(user, 't1');
        node_assert_1.strict.ok(typeof token === 'string');
        const decoded = jwt.verify(token, 'test-secret');
        node_assert_1.strict.strictEqual(decoded.sub, 'u1');
        node_assert_1.strict.strictEqual(decoded.email, 'test@example.com');
    });
    (0, node_test_1.it)('disconnect calls prisma disconnect', async () => {
        await service.disconnect();
        node_assert_1.strict.strictEqual(mockPrisma.$disconnect.mock.callCount(), 1);
    });
});
//# sourceMappingURL=toolkit-auth.service.test.js.map