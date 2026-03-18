import { AlertStatus } from '@prisma/client';
export declare class GetAlertsQueryDto {
    tenantId: string;
    status?: AlertStatus;
}
