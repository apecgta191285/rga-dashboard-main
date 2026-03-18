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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const auth_repository_1 = require("./auth.repository");
const users_repository_1 = require("../users/users.repository");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
const crypto = __importStar(require("crypto"));
const mail_service_1 = require("../../common/services/mail.service");
const auth_exception_1 = require("./auth.exception");
let AuthService = AuthService_1 = class AuthService {
    constructor(authRepository, usersRepository, jwt, config, auditLogsService, prisma, mailService) {
        this.authRepository = authRepository;
        this.usersRepository = usersRepository;
        this.jwt = jwt;
        this.config = config;
        this.auditLogsService = auditLogsService;
        this.prisma = prisma;
        this.mailService = mailService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(dto) {
        if (!dto.termsAccepted) {
            throw new auth_exception_1.TermsNotAcceptedException();
        }
        const normalizedEmail = (dto.email || '').trim().toLowerCase();
        const normalizedUsername = (dto.username || '').trim().toLowerCase();
        const existing = await this.prisma.user.findFirst({
            where: { email: normalizedEmail },
        });
        if (existing) {
            throw new auth_exception_1.EmailExistsException();
        }
        const existingUsername = await this.prisma.user.findFirst({
            where: { username: normalizedUsername },
        });
        if (existingUsername) {
            throw new auth_exception_1.UsernameExistsException();
        }
        const normalizedDto = {
            ...dto,
            email: normalizedEmail,
            username: normalizedUsername,
            firstName: (dto.firstName || '').trim(),
            lastName: (dto.lastName || '').trim(),
        };
        const hashedPassword = await bcrypt.hash(normalizedDto.password, 10);
        const user = await this.authRepository.createTenantAndUser(normalizedDto, hashedPassword);
        const { token, tokenHash, expiresAt } = this.generateEmailVerificationToken();
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationTokenHash: tokenHash,
                emailVerificationTokenExpiresAt: expiresAt,
            },
        });
        try {
            await this.sendVerificationEmail(user.email, token);
        }
        catch (e) {
            this.logger.error(`Failed to send verification email to ${user.email}: ${e?.message || e}`, e?.stack);
        }
        const tokens = await this.generateTokens(user.id, user.email);
        await this.authRepository.saveRefreshToken(user.id, tokens.refreshToken);
        await this.auditLogsService.createLog({
            userId: user.id,
            action: 'REGISTER',
            resource: 'User',
            details: { email: user.email, tenantId: user.tenant.id },
        });
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async verifyEmail(token) {
        if (!token) {
            throw new auth_exception_1.InvalidEmailVerificationTokenException();
        }
        const tokenHash = this.hashToken(token);
        const user = await this.prisma.user.findFirst({
            where: {
                emailVerificationTokenHash: tokenHash,
            },
        });
        if (!user) {
            throw new auth_exception_1.InvalidEmailVerificationTokenException();
        }
        if (user.emailVerificationTokenExpiresAt && user.emailVerificationTokenExpiresAt < new Date()) {
            throw new auth_exception_1.EmailVerificationTokenExpiredException();
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerificationTokenHash: null,
                emailVerificationTokenExpiresAt: null,
            },
        });
        return { message: 'Email verified successfully' };
    }
    async resendVerificationEmail(email) {
        if (!email) {
            throw new auth_exception_1.InvalidCredentialsException();
        }
        const user = await this.prisma.user.findFirst({
            where: { email },
        });
        if (!user) {
            return { message: 'If an account exists for this email, a verification email has been sent.' };
        }
        if (user.emailVerified) {
            return { message: 'Email is already verified.' };
        }
        const { token, tokenHash, expiresAt } = this.generateEmailVerificationToken();
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationTokenHash: tokenHash,
                emailVerificationTokenExpiresAt: expiresAt,
            },
        });
        try {
            await this.sendVerificationEmail(email, token);
            return { message: 'Verification email sent' };
        }
        catch (e) {
            this.logger.error(`Failed to resend verification email to ${email}: ${e?.message || e}`, e?.stack);
            return { message: "We couldn't send the email right now. Please try again later." };
        }
    }
    async login(dto, request) {
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email },
            include: { tenant: true },
        });
        if (user?.lockedUntil && user.lockedUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            throw new auth_exception_1.AccountLockedException(minutesLeft);
        }
        if (!user || !user.isActive) {
            throw new auth_exception_1.InvalidCredentialsException();
        }
        if (!user.emailVerified) {
            throw new auth_exception_1.EmailNotVerifiedException();
        }
        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid) {
            const newFailedCount = (user.failedLoginCount || 0) + 1;
            const shouldLock = newFailedCount >= 5;
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginCount: newFailedCount,
                    lockedUntil: shouldLock
                        ? new Date(Date.now() + 30 * 60 * 1000)
                        : null,
                },
            });
            const remainingAttempts = 5 - newFailedCount;
            throw new auth_exception_1.InvalidCredentialsException(remainingAttempts > 0 ? remainingAttempts : undefined);
        }
        const clientIp = request?.ip || request?.socket?.remoteAddress || null;
        const userAgent = request?.headers?.['user-agent'] || null;
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                lastLoginIp: clientIp,
                failedLoginCount: 0,
                lockedUntil: null,
            },
        });
        const tokens = await this.generateTokens(user.id, user.email);
        await this.authRepository.saveRefreshToken(user.id, tokens.refreshToken, clientIp, userAgent);
        await this.auditLogsService.createLog({
            userId: user.id,
            action: 'LOGIN',
            resource: 'Auth',
            details: {
                email: user.email,
                ip: clientIp,
            },
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                tenant: { id: user.tenant.id, name: user.tenant.name },
            },
            ...tokens,
        };
    }
    async refreshToken(token, request) {
        try {
            const payload = await this.jwt.verifyAsync(token, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
            const session = await this.authRepository.findSessionByToken(token);
            if (!session) {
                throw new auth_exception_1.TokenRevokedException();
            }
            await this.authRepository.deleteRefreshToken(token);
            const user = await this.prisma.user.findFirst({
                where: { email: payload.email },
            });
            if (!user) {
                throw new auth_exception_1.UserNotFoundException();
            }
            const tokens = await this.generateTokens(user.id, user.email);
            const clientIp = request?.ip || request?.socket?.remoteAddress || null;
            const userAgent = request?.headers?.['user-agent'] || null;
            await this.authRepository.saveRefreshToken(user.id, tokens.refreshToken, clientIp, userAgent);
            return tokens;
        }
        catch (e) {
            await this.authRepository.deleteRefreshToken(token).catch(() => { });
            throw new auth_exception_1.TokenExpiredException();
        }
    }
    async logout(userId, refreshToken) {
        if (refreshToken) {
            await this.authRepository.deleteRefreshToken(refreshToken);
        }
        await this.auditLogsService.createLog({
            userId,
            action: 'LOGOUT',
            resource: 'Auth',
            details: {},
        });
        return { message: 'Logged out successfully' };
    }
    async logoutAll(userId) {
        await this.authRepository.revokeAllUserSessions(userId);
        await this.auditLogsService.createLog({
            userId,
            action: 'LOGOUT_ALL',
            resource: 'Auth',
            details: {},
        });
        return { message: 'Logged out from all devices' };
    }
    async generateTokens(userId, email) {
        const accessExpiry = this.config.get('JWT_ACCESS_EXPIRY') ||
            this.config.get('JWT_EXPIRES_IN') ||
            '15m';
        const refreshExpiry = this.config.get('JWT_REFRESH_EXPIRY') ||
            this.config.get('JWT_REFRESH_EXPIRES_IN') ||
            '7d';
        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync({ sub: userId, email }, { secret: this.config.get('JWT_SECRET'), expiresIn: accessExpiry }),
            this.jwt.signAsync({ sub: userId, email }, { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: refreshExpiry }),
        ]);
        return { accessToken, refreshToken };
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenant: {
                id: user.tenant.id,
                name: user.tenant.name,
            },
        };
    }
    generateEmailVerificationToken() {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        return { token, tokenHash, expiresAt };
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    async sendVerificationEmail(email, token) {
        const appUrl = this.config.get('APP_URL', 'http://localhost:5173');
        const verifyUrl = `${appUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
        const subject = 'Email Verification - RGA Dashboard';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; margin-bottom: 20px;">Welcome to RGA Dashboard</h2>
        <p style="color: #666; line-height: 1.6;">Thank you for registering with RGA Dashboard. To complete your registration and access your account, please verify your email address.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #999; font-size: 14px;">If you did not create this account, please disregard this email. Your account will not be activated without verification.</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated message from RGA Dashboard. Please do not reply to this email.</p>
      </div>
    `;
        await this.mailService.sendMail({
            to: email,
            subject,
            html,
        });
    }
    async forgotPassword(dto) {
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email },
        });
        if (!user) {
            return { message: 'If an account exists with this email, a password reset link has been sent.' };
        }
        const { token, tokenHash, expiresAt } = this.generatePasswordResetToken();
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetTokenHash: tokenHash,
                passwordResetTokenExpiresAt: expiresAt,
            },
        });
        try {
            await this.sendPasswordResetEmail(user.email, token);
        }
        catch (e) {
            this.logger.error(`Failed to send password reset email to ${user.email}: ${e?.message || e}`, e?.stack);
        }
        return { message: 'If an account exists with this email, a password reset link has been sent.' };
    }
    async resetPassword(dto) {
        const tokenHash = this.hashToken(dto.token);
        const user = await this.prisma.user.findFirst({
            where: {
                passwordResetTokenHash: tokenHash,
                passwordResetTokenExpiresAt: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            throw new auth_exception_1.InvalidCredentialsException();
        }
        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetTokenHash: null,
                passwordResetTokenExpiresAt: null,
            },
        });
        await this.auditLogsService.createLog({
            userId: user.id,
            action: 'PASSWORD_RESET',
            resource: 'user',
            details: { email: user.email },
        });
        return { message: 'Password reset successfully' };
    }
    generatePasswordResetToken() {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        return { token, tokenHash, expiresAt };
    }
    async sendPasswordResetEmail(email, token) {
        const appUrl = this.config.get('APP_URL', 'http://localhost:5173');
        const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
        const subject = 'Password Reset - RGA Dashboard';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="color: #666; line-height: 1.6;">We received a request to reset your password for your RGA Dashboard account. Click the link below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
        <p style="color: #999; font-size: 14px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated message from RGA Dashboard. Please do not reply to this email.</p>
      </div>
    `;
        await this.mailService.sendMail({
            to: email,
            subject,
            html,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_repository_1.AuthRepository,
        users_repository_1.UsersRepository,
        jwt_1.JwtService,
        config_1.ConfigService,
        audit_logs_service_1.AuditLogsService,
        prisma_service_1.PrismaService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map