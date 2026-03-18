"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaAuthRepository = exports.AuthRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
class AuthRepository {
}
exports.AuthRepository = AuthRepository;
let PrismaAuthRepository = class PrismaAuthRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTenantAndUser(dto, hashedPassword) {
        return this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: { name: dto.companyName },
            });
            return tx.user.create({
                data: {
                    email: dto.email,
                    username: dto.username,
                    password: hashedPassword,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    termsAcceptedAt: new Date(),
                    role: client_1.UserRole.ADMIN,
                    tenantId: tenant.id,
                },
                include: { tenant: true },
            });
        });
    }
    async saveRefreshToken(userId, refreshToken, ipAddress, userAgent) {
        await this.prisma.session.create({
            data: {
                userId,
                refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                ipAddress: ipAddress || null,
                userAgent: userAgent || null,
            },
        });
    }
    async deleteRefreshToken(token) {
        await this.prisma.session.deleteMany({
            where: { refreshToken: token },
        });
    }
    async revokeAllUserSessions(userId) {
        await this.prisma.session.deleteMany({
            where: { userId },
        });
    }
    async findSessionByToken(token) {
        return this.prisma.session.findUnique({
            where: { refreshToken: token },
            select: { userId: true },
        });
    }
};
exports.PrismaAuthRepository = PrismaAuthRepository;
exports.PrismaAuthRepository = PrismaAuthRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaAuthRepository);
//# sourceMappingURL=auth.repository.js.map