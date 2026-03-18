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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatService = ChatService_1 = class ChatService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ChatService_1.name);
    }
    async createSession(tenantId, userId, createSessionDto) {
        if (!userId) {
            throw new common_1.NotFoundException('Cannot create chat session without user');
        }
        return this.prisma.chatSession.create({
            data: {
                userId,
                title: createSessionDto.title || 'New Chat',
            },
            include: {
                messages: true,
            },
        });
    }
    async getSessions(userId) {
        if (!userId) {
            return [];
        }
        return this.prisma.chatSession.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { messages: true },
                },
            },
        });
    }
    async getSession(id) {
        const session = await this.prisma.chatSession.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException(`Chat session with ID ${id} not found`);
        }
        return session;
    }
    async addMessage(tenantId, sessionId, createMessageDto) {
        const session = await this.prisma.chatSession.findUnique({
            where: { id: sessionId },
        });
        if (!session) {
            throw new common_1.NotFoundException(`Chat session with ID ${sessionId} not found`);
        }
        const message = await this.prisma.chatMessage.create({
            data: {
                sessionId,
                role: createMessageDto.role,
                content: createMessageDto.content,
            },
        });
        await this.prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
        });
        if (createMessageDto.role === 'user' && session.title === 'New Chat') {
            const firstFewWords = createMessageDto.content.split(' ').slice(0, 5).join(' ');
            await this.prisma.chatSession.update({
                where: { id: sessionId },
                data: { title: firstFewWords || 'New Chat' }
            });
        }
        return message;
    }
    async updateSessionTitle(id, title) {
        const session = await this.prisma.chatSession.findUnique({ where: { id } });
        if (!session) {
            throw new common_1.NotFoundException(`Chat session with ID ${id} not found`);
        }
        return this.prisma.chatSession.update({
            where: { id },
            data: { title },
        });
    }
    async deleteSession(id) {
        return this.prisma.chatSession.delete({
            where: { id },
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map