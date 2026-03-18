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
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const auth_repository_1 = require("./auth.repository");
const users_repository_1 = require("../users/users.repository");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const mockTenant = {
    id: 'tenant-001',
    name: 'Test Company',
    createdAt: new Date(),
    updatedAt: new Date(),
};
const createMockUser = (overrides = {}) => ({
    id: 'user-001',
    email: 'test@rga.com',
    password: bcrypt.hashSync('correct-password', 10),
    name: 'Test User',
    role: client_1.UserRole.ADMIN,
    tenantId: 'tenant-001',
    tenant: mockTenant,
    isActive: true,
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: null,
    lastLoginIp: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});
const mockRequest = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'Jest Test Agent' },
};
const mockAuthRepository = {
    createTenantAndUser: jest.fn(),
    saveRefreshToken: jest.fn(),
    deleteRefreshToken: jest.fn(),
    revokeAllUserSessions: jest.fn(),
    findSessionByToken: jest.fn(),
};
const mockUsersRepository = {
    findByEmail: jest.fn(),
};
const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
    verifyAsync: jest.fn(),
};
const mockConfigService = {
    get: jest.fn((key, defaultValue) => {
        const config = {
            JWT_SECRET: 'test-secret',
            JWT_REFRESH_SECRET: 'test-refresh-secret',
            JWT_ACCESS_EXPIRY: '15m',
            JWT_REFRESH_EXPIRY: '7d',
        };
        return config[key] || defaultValue;
    }),
};
const mockAuditLogsService = {
    createLog: jest.fn(),
};
const mockPrismaService = {
    user: {
        update: jest.fn(),
    },
    session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        deleteMany: jest.fn(),
    },
};
describe('AuthService', () => {
    let service;
    let usersRepository;
    let prismaService;
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: auth_repository_1.AuthRepository, useValue: mockAuthRepository },
                { provide: users_repository_1.UsersRepository, useValue: mockUsersRepository },
                { provide: jwt_1.JwtService, useValue: mockJwtService },
                { provide: config_1.ConfigService, useValue: mockConfigService },
                { provide: audit_logs_service_1.AuditLogsService, useValue: mockAuditLogsService },
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        usersRepository = mockUsersRepository;
        prismaService = mockPrismaService;
    });
    describe('login', () => {
        describe('AUTH-001: Login with valid credentials', () => {
            it('should return accessToken, refreshToken, and user data', async () => {
                const mockUser = createMockUser();
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                prismaService.user.update.mockResolvedValue(mockUser);
                mockJwtService.signAsync
                    .mockResolvedValueOnce('access-token-123')
                    .mockResolvedValueOnce('refresh-token-456');
                const result = await service.login({ email: 'test@rga.com', password: 'correct-password' }, mockRequest);
                expect(result).toHaveProperty('accessToken', 'access-token-123');
                expect(result).toHaveProperty('refreshToken', 'refresh-token-456');
                expect(result).toHaveProperty('user');
                expect(result.user.email).toBe('test@rga.com');
            });
            it('should reset failedLoginCount to 0 on successful login', async () => {
                const mockUser = createMockUser({ failedLoginCount: 3 });
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                prismaService.user.update.mockResolvedValue(mockUser);
                await service.login({ email: 'test@rga.com', password: 'correct-password' }, mockRequest);
                expect(prismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        failedLoginCount: 0,
                        lockedUntil: null,
                    }),
                }));
            });
            it('should update lastLoginAt on successful login', async () => {
                const mockUser = createMockUser();
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                prismaService.user.update.mockResolvedValue(mockUser);
                await service.login({ email: 'test@rga.com', password: 'correct-password' }, mockRequest);
                expect(prismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        lastLoginAt: expect.any(Date),
                    }),
                }));
            });
            it('should update lastLoginIp on successful login', async () => {
                const mockUser = createMockUser();
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                prismaService.user.update.mockResolvedValue(mockUser);
                await service.login({ email: 'test@rga.com', password: 'correct-password' }, mockRequest);
                expect(prismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        lastLoginIp: '127.0.0.1',
                    }),
                }));
            });
        });
        describe('AUTH-002: Login with wrong password', () => {
            it('should throw UnauthorizedException', async () => {
                const mockUser = createMockUser();
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                prismaService.user.update.mockResolvedValue({
                    ...mockUser,
                    failedLoginCount: 1,
                });
                await expect(service.login({ email: 'test@rga.com', password: 'wrong-password' }, mockRequest)).rejects.toThrow(common_1.UnauthorizedException);
            });
            it('should increment failedLoginCount', async () => {
                const mockUser = createMockUser({ failedLoginCount: 0 });
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                prismaService.user.update.mockResolvedValue({
                    ...mockUser,
                    failedLoginCount: 1,
                });
                try {
                    await service.login({ email: 'test@rga.com', password: 'wrong-password' }, mockRequest);
                }
                catch (e) {
                }
                expect(prismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        failedLoginCount: 1,
                    }),
                }));
            });
            it('should increment failedLoginCount progressively', async () => {
                const mockUser = createMockUser({ failedLoginCount: 2 });
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                prismaService.user.update.mockResolvedValue({
                    ...mockUser,
                    failedLoginCount: 3,
                });
                try {
                    await service.login({ email: 'test@rga.com', password: 'wrong-password' }, mockRequest);
                }
                catch (e) {
                }
                expect(prismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        failedLoginCount: 3,
                    }),
                }));
            });
        });
        describe('AUTH-003: Login with non-existent email', () => {
            it('should throw UnauthorizedException with generic message', async () => {
                usersRepository.findByEmail.mockResolvedValue(null);
                await expect(service.login({ email: 'nonexistent@rga.com', password: 'any-password' }, mockRequest)).rejects.toThrow(common_1.UnauthorizedException);
            });
            it('should not leak information about email existence', async () => {
                usersRepository.findByEmail.mockResolvedValue(null);
                try {
                    await service.login({ email: 'nonexistent@rga.com', password: 'any-password' }, mockRequest);
                }
                catch (e) {
                    expect(e.message).toBe('Invalid credentials');
                }
            });
        });
        describe('AUTH-004: Account lockout after 5 failed attempts', () => {
            it('should set lockedUntil after 5th failed attempt', async () => {
                const mockUser = createMockUser({ failedLoginCount: 4 });
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                prismaService.user.update.mockResolvedValue({
                    ...mockUser,
                    failedLoginCount: 5,
                    lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
                });
                try {
                    await service.login({ email: 'test@rga.com', password: 'wrong-password' }, mockRequest);
                }
                catch (e) {
                }
                expect(prismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        failedLoginCount: 5,
                        lockedUntil: expect.any(Date),
                    }),
                }));
            });
            it('should not set lockedUntil before 5th attempt', async () => {
                const mockUser = createMockUser({ failedLoginCount: 3 });
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                prismaService.user.update.mockResolvedValue({
                    ...mockUser,
                    failedLoginCount: 4,
                });
                try {
                    await service.login({ email: 'test@rga.com', password: 'wrong-password' }, mockRequest);
                }
                catch (e) {
                }
                expect(prismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        failedLoginCount: 4,
                        lockedUntil: null,
                    }),
                }));
            });
        });
        describe('AUTH-005: Login while account is locked', () => {
            it('should throw UnauthorizedException with lock message', async () => {
                const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
                const mockUser = createMockUser({
                    failedLoginCount: 5,
                    lockedUntil,
                });
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                await expect(service.login({ email: 'test@rga.com', password: 'correct-password' }, mockRequest)).rejects.toThrow(/Account is locked/);
            });
            it('should include remaining lockout time in error message', async () => {
                const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
                const mockUser = createMockUser({
                    failedLoginCount: 5,
                    lockedUntil,
                });
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                try {
                    await service.login({ email: 'test@rga.com', password: 'correct-password' }, mockRequest);
                }
                catch (e) {
                    expect(e.message).toMatch(/\d+ minutes/);
                }
            });
            it('should not call password validation when locked', async () => {
                const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
                const mockUser = createMockUser({
                    failedLoginCount: 5,
                    lockedUntil,
                });
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                try {
                    await service.login({ email: 'test@rga.com', password: 'correct-password' }, mockRequest);
                }
                catch (e) {
                }
                expect(prismaService.user.update).not.toHaveBeenCalled();
            });
        });
        describe('AUTH-006: Login after lockout expires', () => {
            it('should allow login with correct password after lockout expires', async () => {
                const expiredLock = new Date(Date.now() - 1000);
                const mockUser = createMockUser({
                    failedLoginCount: 5,
                    lockedUntil: expiredLock,
                });
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                prismaService.user.update.mockResolvedValue({
                    ...mockUser,
                    failedLoginCount: 0,
                    lockedUntil: null,
                });
                const result = await service.login({ email: 'test@rga.com', password: 'correct-password' }, mockRequest);
                expect(result).toHaveProperty('accessToken');
            });
        });
        describe('Inactive user login', () => {
            it('should reject login for inactive users', async () => {
                const mockUser = createMockUser({ isActive: false });
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                await expect(service.login({ email: 'test@rga.com', password: 'correct-password' }, mockRequest)).rejects.toThrow(common_1.UnauthorizedException);
            });
        });
    });
    describe('refreshToken', () => {
        describe('AUTH-007: Token refresh with valid token', () => {
            it('should return new accessToken and refreshToken', async () => {
                const mockUser = createMockUser();
                mockJwtService.verifyAsync.mockResolvedValue({
                    sub: 'user-001',
                    email: 'test@rga.com',
                });
                mockAuthRepository.findSessionByToken.mockResolvedValue({
                    userId: 'user-001',
                });
                mockAuthRepository.deleteRefreshToken.mockResolvedValue(undefined);
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                mockJwtService.signAsync
                    .mockResolvedValueOnce('new-access-token')
                    .mockResolvedValueOnce('new-refresh-token');
                const result = await service.refreshToken('valid-refresh-token', mockRequest);
                expect(result).toHaveProperty('accessToken', 'new-access-token');
                expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
            });
            it('should delete old refresh token (rotation)', async () => {
                const mockUser = createMockUser();
                mockJwtService.verifyAsync.mockResolvedValue({
                    sub: 'user-001',
                    email: 'test@rga.com',
                });
                mockAuthRepository.findSessionByToken.mockResolvedValue({
                    userId: 'user-001',
                });
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                await service.refreshToken('valid-refresh-token', mockRequest);
                expect(mockAuthRepository.deleteRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
            });
            it('should save new refresh token', async () => {
                const mockUser = createMockUser();
                mockJwtService.verifyAsync.mockResolvedValue({
                    sub: 'user-001',
                    email: 'test@rga.com',
                });
                mockAuthRepository.findSessionByToken.mockResolvedValue({
                    userId: 'user-001',
                });
                usersRepository.findByEmail.mockResolvedValue(mockUser);
                mockJwtService.signAsync
                    .mockResolvedValueOnce('new-access')
                    .mockResolvedValueOnce('new-refresh');
                await service.refreshToken('valid-refresh-token', mockRequest);
                expect(mockAuthRepository.saveRefreshToken).toHaveBeenCalledWith('user-001', 'new-refresh', expect.any(String), expect.any(String));
            });
        });
        describe('AUTH-008: Token refresh with expired token', () => {
            it('should throw UnauthorizedException', async () => {
                mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
                await expect(service.refreshToken('expired-refresh-token', mockRequest)).rejects.toThrow(common_1.UnauthorizedException);
            });
        });
        describe('AUTH-009: Token refresh with revoked token', () => {
            it('should throw UnauthorizedException when token not in database', async () => {
                mockJwtService.verifyAsync.mockResolvedValue({
                    sub: 'user-001',
                    email: 'test@rga.com',
                });
                mockAuthRepository.findSessionByToken.mockResolvedValue(null);
                await expect(service.refreshToken('revoked-token', mockRequest)).rejects.toThrow(common_1.UnauthorizedException);
            });
            it('should throw with "Invalid refresh token" message for revoked token', async () => {
                mockJwtService.verifyAsync.mockResolvedValue({
                    sub: 'user-001',
                    email: 'test@rga.com',
                });
                mockAuthRepository.findSessionByToken.mockResolvedValue(null);
                try {
                    await service.refreshToken('revoked-token', mockRequest);
                    fail('Expected exception was not thrown');
                }
                catch (e) {
                    expect(e.message).toBe('Invalid refresh token');
                }
            });
        });
    });
    describe('logout', () => {
        it('should delete refresh token', async () => {
            await service.logout('user-001', 'refresh-token-123');
            expect(mockAuthRepository.deleteRefreshToken).toHaveBeenCalledWith('refresh-token-123');
        });
        it('should create audit log', async () => {
            await service.logout('user-001', 'refresh-token-123');
            expect(mockAuditLogsService.createLog).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'user-001',
                action: 'LOGOUT',
            }));
        });
    });
    describe('logoutAll', () => {
        it('should revoke all user sessions', async () => {
            await service.logoutAll('user-001');
            expect(mockAuthRepository.revokeAllUserSessions).toHaveBeenCalledWith('user-001');
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map