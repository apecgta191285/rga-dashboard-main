import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class GoogleAnalyticsApiService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private oauth2Client;
    constructor(configService: ConfigService, prisma: PrismaService);
    runReport(account: any, requestBody: any): Promise<import("googleapis").analyticsdata_v1beta.Schema$RunReportResponse>;
    private getAuthenticatedClient;
    private refreshTokenIfNeeded;
    private handleApiError;
}
