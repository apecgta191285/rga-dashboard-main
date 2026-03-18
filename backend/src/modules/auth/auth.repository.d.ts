import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto';
import { User } from '@prisma/client';
export declare abstract class AuthRepository {
    abstract createTenantAndUser(dto: RegisterDto, hashedPassword: string): Promise<User>;
    abstract saveRefreshToken(userId: string, refreshToken: string, ipAddress?: string | null, userAgent?: string | null): Promise<void>;
    abstract deleteRefreshToken(token: string): Promise<void>;
    abstract revokeAllUserSessions(userId: string): Promise<void>;
    abstract findSessionByToken(token: string): Promise<{
        userId: string;
    } | null>;
}
export declare class PrismaAuthRepository implements AuthRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createTenantAndUser(dto: RegisterDto, hashedPassword: string): Promise<User>;
    saveRefreshToken(userId: string, refreshToken: string, ipAddress?: string | null, userAgent?: string | null): Promise<void>;
    deleteRefreshToken(token: string): Promise<void>;
    revokeAllUserSessions(userId: string): Promise<void>;
    findSessionByToken(token: string): Promise<{
        userId: string;
    } | null>;
}
