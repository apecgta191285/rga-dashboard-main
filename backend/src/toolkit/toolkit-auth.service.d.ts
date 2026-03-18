import { PrismaClient } from '@prisma/client';
export interface ToolkitUser {
    id: string;
    email: string;
    role: string;
}
export interface JwtPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
}
export declare class ToolkitAuthService {
    private readonly prisma;
    constructor(prisma?: PrismaClient);
    getOrCreateAdmin(tenantId: string): Promise<ToolkitUser>;
    generateImpersonationToken(user: {
        id: string;
        email: string;
    }, _tenantId: string): string;
    disconnect(): Promise<void>;
}
