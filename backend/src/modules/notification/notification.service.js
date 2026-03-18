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
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let NotificationService = class NotificationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, dto) {
        return this.prisma.notification.create({
            data: {
                tenantId,
                userId: dto.userId,
                type: dto.type,
                title: dto.title,
                message: dto.message,
                channel: dto.channel || client_1.NotificationChannel.IN_APP,
                priority: dto.priority || 'NORMAL',
                metadata: dto.metadata || null,
                alertId: dto.alertId || null,
                campaignId: dto.campaignId || null,
            },
        });
    }
    async triggerFromAlert(alert) {
        const users = await this.prisma.user.findMany({
            where: { tenantId: alert.tenantId, isActive: true },
            select: { id: true },
        });
        const notifications = users.map((user) => ({
            tenantId: alert.tenantId,
            userId: user.id,
            type: 'ALERT',
            title: alert.title,
            message: alert.message,
            channel: client_1.NotificationChannel.IN_APP,
            priority: alert.severity === 'CRITICAL' ? 'HIGH' : 'NORMAL',
            alertId: alert.id,
            metadata: {
                alertType: alert.type,
                severity: alert.severity,
                actionUrl: `/dashboard/alerts/${alert.id}`,
                actionText: 'ดูรายละเอียด',
            },
        }));
        await this.prisma.notification.createMany({ data: notifications });
    }
    async sendSystemNotification(tenantId, userId, title, message, metadata) {
        return this.prisma.notification.create({
            data: {
                tenantId,
                userId,
                type: 'SYSTEM',
                title,
                message,
                channel: client_1.NotificationChannel.IN_APP,
                priority: 'NORMAL',
                metadata: metadata || null,
            },
        });
    }
    async notifySyncComplete(tenantId, userId, platform, recordsCount) {
        return this.prisma.notification.create({
            data: {
                tenantId,
                userId,
                type: 'SYNC_COMPLETE',
                title: `${platform} Sync Complete`,
                message: `Successfully synced ${recordsCount} records from ${platform}.`,
                channel: client_1.NotificationChannel.IN_APP,
                priority: 'LOW',
                metadata: {
                    platform,
                    recordsCount,
                    actionUrl: '/dashboard',
                    actionText: 'View Dashboard',
                },
            },
        });
    }
    async findAll(userId, query) {
        const { page = 1, limit = 20, isRead, type } = query;
        const skip = (page - 1) * limit;
        const where = {
            userId,
            isDismissed: false,
        };
        if (isRead !== undefined) {
            where.isRead = isRead;
        }
        if (type) {
            where.type = type;
        }
        const [data, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    type: true,
                    title: true,
                    message: true,
                    channel: true,
                    priority: true,
                    metadata: true,
                    isRead: true,
                    readAt: true,
                    createdAt: true,
                    alertId: true,
                    campaignId: true,
                },
            }),
            this.prisma.notification.count({ where }),
        ]);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: { userId, isRead: false, isDismissed: false },
        });
    }
    async markAsRead(id, userId) {
        const notification = await this.prisma.notification.findFirst({
            where: { id, userId },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllAsRead(userId) {
        const result = await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return { count: result.count };
    }
    async dismiss(id, userId) {
        const notification = await this.prisma.notification.findFirst({
            where: { id, userId },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        return this.prisma.notification.update({
            where: { id },
            data: { isDismissed: true },
        });
    }
    async deleteOldNotifications(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const result = await this.prisma.notification.deleteMany({
            where: {
                createdAt: { lt: cutoffDate },
                isDismissed: true,
            },
        });
        return { count: result.count };
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map