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
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AiService = class AiService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createUserBehavior(tenantId, userId, dto) {
        return this.prisma.userBehavior.create({
            data: {
                tenantId,
                userId,
                action: dto.action,
                data: dto.data ?? undefined,
            },
        });
    }
    async listUserBehavior(tenantId, userId, query) {
        const limit = Math.min(query.limit ?? 50, 200);
        const where = {
            tenantId,
            userId,
            ...(query.action ? { action: query.action } : {}),
        };
        const rows = await this.prisma.userBehavior.findMany({
            where,
            take: limit + 1,
            ...(query.cursor
                ? {
                    cursor: { id: query.cursor },
                    skip: 1,
                }
                : {}),
            orderBy: { timestamp: 'desc' },
        });
        const hasNextPage = rows.length > limit;
        const items = hasNextPage ? rows.slice(0, limit) : rows;
        return {
            items,
            nextCursor: hasNextPage ? items[items.length - 1].id : null,
        };
    }
    async createAiRecommendation(tenantId, dto) {
        return this.prisma.aiRecommendation.create({
            data: {
                tenantId,
                type: dto.type,
                title: dto.title,
                description: dto.description,
                priority: dto.priority ?? 'MEDIUM',
                confidence: dto.confidence ?? 0,
                status: dto.status ?? 'PENDING',
                payload: dto.payload ?? undefined,
            },
        });
    }
    async listAiRecommendations(tenantId, query) {
        const limit = Math.min(query.limit ?? 50, 200);
        const where = {
            tenantId,
            ...(query.status ? { status: query.status } : {}),
            ...(query.type ? { type: query.type } : {}),
        };
        const rows = await this.prisma.aiRecommendation.findMany({
            where,
            take: limit + 1,
            ...(query.cursor
                ? {
                    cursor: { id: query.cursor },
                    skip: 1,
                }
                : {}),
            orderBy: { createdAt: 'desc' },
        });
        const hasNextPage = rows.length > limit;
        const items = hasNextPage ? rows.slice(0, limit) : rows;
        return {
            items,
            nextCursor: hasNextPage ? items[items.length - 1].id : null,
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiService);
//# sourceMappingURL=ai.service.js.map