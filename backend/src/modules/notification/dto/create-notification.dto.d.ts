import { NotificationChannel } from '@prisma/client';
export declare class CreateNotificationDto {
    userId: string;
    type: string;
    title: string;
    message: string;
    channel?: NotificationChannel;
    priority?: string;
    metadata?: Record<string, any>;
    alertId?: string;
    campaignId?: string;
}
export declare class MarkAsReadDto {
    isRead: boolean;
}
