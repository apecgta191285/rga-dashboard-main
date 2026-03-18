import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { Notification, Alert } from '@prisma/client';
export declare class NotificationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, dto: CreateNotificationDto): Promise<Notification>;
    triggerFromAlert(alert: Alert): Promise<void>;
    sendSystemNotification(tenantId: string, userId: string, title: string, message: string, metadata?: Record<string, any>): Promise<Notification>;
    notifySyncComplete(tenantId: string, userId: string, platform: string, recordsCount: number): Promise<Notification>;
    findAll(userId: string, query: NotificationQueryDto): Promise<{
        data: {
            type: string;
            title: string;
            id: string;
            createdAt: Date;
            campaignId: string;
            metadata: import("@prisma/client/runtime/client").JsonValue;
            message: string;
            channel: import(".prisma/client").$Enums.NotificationChannel;
            priority: string;
            alertId: string;
            isRead: boolean;
            readAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(id: string, userId: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<{
        count: number;
    }>;
    dismiss(id: string, userId: string): Promise<Notification>;
    deleteOldNotifications(daysOld?: number): Promise<{
        count: number;
    }>;
}
