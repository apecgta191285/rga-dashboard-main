import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from './auth.repository';
import { UsersRepository } from '../users/users.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { Request } from 'express';
import { MailService } from '../../common/services/mail.service';
export declare class AuthService {
    private readonly authRepository;
    private readonly usersRepository;
    private readonly jwt;
    private readonly config;
    private readonly auditLogsService;
    private readonly prisma;
    private readonly mailService;
    private readonly logger;
    constructor(authRepository: AuthRepository, usersRepository: UsersRepository, jwt: JwtService, config: ConfigService, auditLogsService: AuditLogsService, prisma: PrismaService, mailService: MailService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            tenant: {
                id: string;
                name: string;
            };
        };
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    resendVerificationEmail(email: string): Promise<{
        message: string;
    }>;
    login(dto: LoginDto, request?: Request): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            tenant: {
                id: string;
                name: string;
            };
        };
    }>;
    refreshToken(token: string, request?: Request): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, refreshToken?: string): Promise<{
        message: string;
    }>;
    logoutAll(userId: string): Promise<{
        message: string;
    }>;
    private generateTokens;
    private sanitizeUser;
    private generateEmailVerificationToken;
    private hashToken;
    private sendVerificationEmail;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    private generatePasswordResetToken;
    private sendPasswordResetEmail;
}
