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
require("dotenv/config");
const client_1 = require("@prisma/client");
const jwt = __importStar(require("jsonwebtoken"));
function buildApiBaseUrl() {
    return process.env.API_BASE_URL || 'http://localhost:3000';
}
async function createAccessToken(prisma, tenantSlug) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is required.');
    }
    const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true },
    });
    if (!tenant) {
        throw new Error(`Tenant slug "${tenantSlug}" not found.`);
    }
    const user = await prisma.user.findFirst({
        where: {
            tenantId: tenant.id,
            isActive: true,
        },
        select: {
            id: true,
            email: true,
        },
        orderBy: { createdAt: 'asc' },
    });
    if (!user) {
        throw new Error(`No active user found for tenant "${tenantSlug}". Create at least one user before contract check.`);
    }
    const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '5m' });
    return { token, tenantId: tenant.id };
}
async function main() {
    const prisma = new client_1.PrismaClient();
    const tenantSlug = process.env.TOOLKIT_CHECK_TENANT_SLUG || 'rga-demo';
    const apiBaseUrl = buildApiBaseUrl();
    try {
        const { token, tenantId } = await createAccessToken(prisma, tenantSlug);
        const response = await fetch(`${apiBaseUrl}/api/v1/dashboard/overview?provenance=ALL`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const body = (await response.json());
        const hasPlatformPerformance = Array.isArray(body?.data?.platformPerformance);
        const ok = response.ok && hasPlatformPerformance;
        console.log(JSON.stringify({
            ok,
            checkedAt: new Date().toISOString(),
            apiBaseUrl,
            tenantSlug,
            tenantId,
            statusCode: response.status,
            hasPlatformPerformance,
        }, null, 2));
        process.exit(ok ? 0 : 1);
    }
    catch (error) {
        console.error(JSON.stringify({
            ok: false,
            checkedAt: new Date().toISOString(),
            apiBaseUrl,
            tenantSlug,
            error: error instanceof Error ? error.message : String(error),
        }, null, 2));
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=check-overview-contract.js.map