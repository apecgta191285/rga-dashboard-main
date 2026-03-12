import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    findAll(req: any, query: NotificationQueryDto): Promise<{
        data: {
            id: string;
            createdAt: Date;
            type: string;
            title: string;
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
    getUnreadCount(req: any): Promise<{
        unreadCount: number;
    }>;
    markAsRead(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        type: string;
        title: string;
        expiresAt: Date | null;
        userId: string;
        campaignId: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        message: string;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        priority: string;
        alertId: string | null;
        isRead: boolean;
        readAt: Date | null;
        isDismissed: boolean;
        scheduledAt: Date | null;
        sentAt: Date | null;
    }>;
    markAllAsRead(req: any): Promise<{
        count: number;
    }>;
    dismiss(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        type: string;
        title: string;
        expiresAt: Date | null;
        userId: string;
        campaignId: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        message: string;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        priority: string;
        alertId: string | null;
        isRead: boolean;
        readAt: Date | null;
        isDismissed: boolean;
        scheduledAt: Date | null;
        sentAt: Date | null;
    }>;
}
