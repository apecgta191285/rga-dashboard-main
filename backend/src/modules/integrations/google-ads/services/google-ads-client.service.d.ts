import { Customer } from 'google-ads-api';
import { ConfigService } from '@nestjs/config';
export declare class GoogleAdsClientService {
    private configService;
    private readonly logger;
    private client;
    constructor(configService: ConfigService);
    getCustomer(customerId: string, refreshToken: string, loginCustomerId?: string | null): Customer;
    listAccessibleCustomers(refreshToken: string): Promise<string[]>;
    getClientAccounts(refreshToken: string, loginCustomerId: string): Promise<{
        id: any;
        name: any;
        isManager: any;
        status: string;
    }[]>;
    getAllSelectableAccounts(refreshToken: string): Promise<{
        id: string;
        name: string;
        type: 'ACCOUNT' | 'MANAGER';
        parentMccId?: string;
        parentMccName?: string;
        status: string;
    }[]>;
}
