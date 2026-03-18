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
exports.ToolkitAuthService = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const jwt = __importStar(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const DUMMY_PASSWORD_HASH = '$2b$10$DUMMYHASH.toolkit.placeholder.password.hash';
const TOOLKIT_USER_EMAIL_PREFIX = 'toolkit-admin';
class ToolkitAuthService {
    constructor(prisma) {
        this.prisma = prisma || new client_1.PrismaClient();
    }
    async getOrCreateAdmin(tenantId) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                tenantId: tenantId,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });
        if (existingUser) {
            return {
                id: existingUser.id,
                email: existingUser.email,
                role: existingUser.role,
            };
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new Error(`Tenant not found: ${tenantId}`);
        }
        const newUser = await this.prisma.user.create({
            data: {
                tenantId: tenantId,
                email: `${TOOLKIT_USER_EMAIL_PREFIX}@${tenantId.slice(0, 8)}.local`,
                password: DUMMY_PASSWORD_HASH,
                firstName: 'Toolkit',
                lastName: 'Admin',
                role: client_1.UserRole.ADMIN,
                isActive: true,
                emailVerified: true,
            },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });
        return {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
        };
    }
    generateImpersonationToken(user, _tenantId) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('Missing JWT_SECRET in environment. Check .env file.');
        }
        const payload = {
            sub: user.id,
            email: user.email,
        };
        return jwt.sign(payload, secret, {
            expiresIn: '5m',
        });
    }
    async disconnect() {
        await this.prisma.$disconnect();
    }
}
exports.ToolkitAuthService = ToolkitAuthService;
//# sourceMappingURL=toolkit-auth.service.js.map