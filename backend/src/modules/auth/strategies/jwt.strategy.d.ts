import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly config;
    private readonly prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    validate(payload: {
        sub: string;
        email: string;
    }): Promise<{
        tenant: {
            name: string;
            id: string;
        };
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string;
        lastName: string;
        email: string;
        id: string;
        tenantId: string;
        isActive: boolean;
    }>;
}
export {};
