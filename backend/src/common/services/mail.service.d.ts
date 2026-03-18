import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    private createTransport;
    sendMail(params: {
        to: string;
        subject: string;
        html: string;
    }): Promise<{
        messageId: any;
    }>;
}
