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
exports.PrismaUsersRepository = exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
class UsersRepository {
}
exports.UsersRepository = UsersRepository;
let PrismaUsersRepository = class PrismaUsersRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, data) {
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role || 'CLIENT',
                isActive: data.isActive !== undefined ? data.isActive : true,
                tenantId,
            },
        });
    }
    async findAll(tenantId, query) {
        const { role, isActive, search, page = 1, limit = 10, sortBy, sortOrder } = query;
        const where = { tenantId };
        if (role)
            where.role = role;
        if (isActive !== undefined)
            where.isActive = isActive;
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const orderByField = sortBy || 'createdAt';
        const orderByDirection = sortOrder || 'desc';
        const orderBy = {};
        orderBy[orderByField] = orderByDirection;
        return Promise.all([
            this.prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy,
            }),
            this.prisma.user.count({ where }),
        ]);
    }
    async findOne(tenantId, id) {
        return this.prisma.user.findFirst({
            where: { id, tenantId },
        });
    }
    async findByEmail(tenantId, email) {
        return this.prisma.user.findUnique({
            where: {
                users_tenant_email_unique: {
                    tenantId,
                    email,
                },
            },
            include: { tenant: true },
        });
    }
    async update(tenantId, id, data) {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }
    async remove(tenantId, id) {
        return this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
    }
};
exports.PrismaUsersRepository = PrismaUsersRepository;
exports.PrismaUsersRepository = PrismaUsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaUsersRepository);
//# sourceMappingURL=users.repository.js.map