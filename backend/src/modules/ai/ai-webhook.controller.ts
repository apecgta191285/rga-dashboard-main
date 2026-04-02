// backend/src/modules/ai/ai-webhook.controller.ts
import { HttpService } from '@nestjs/axios';
import { Controller, Post, Body } from '@nestjs/common';

@Controller('api/ai/webhook')
export class AiWebhookController {
    constructor(private http: HttpService) { }

    private async proxyToN8n(webhookEnv: string, body: any) {
        const webhookUrl = process.env[webhookEnv];

        if (!webhookUrl) {
            throw new Error(`${webhookEnv} is not configured`);
        }

        try {
            if (!body?.userId || !body?.tenantId) {
                console.warn(`${webhookEnv} payload missing userId/tenantId`, { userId: body?.userId, tenantId: body?.tenantId });
            }

            const response = await this.http
                .post(webhookUrl, body)
                .toPromise();

            const n8nData = response.data;
            console.log(`${webhookEnv} Response:`, JSON.stringify(n8nData, null, 2));

            const reply = n8nData?.output || n8nData?.reply || n8nData?.message || n8nData?.text || 'No response';

            return {
                success: true,
                message: reply,
                data: n8nData,
                timestamp: new Date(),
            };
        } catch (error) {
            console.error(`${webhookEnv} error:`, (error as any)?.message || error);
            throw new Error(`Webhook error: ${(error as any)?.message || 'Unknown error'}`);
        }
    }

    @Post('general')
    async proxyGeneral(@Body() body: any) {
        return this.proxyToN8n('N8N_WEBHOOK_URL_GENERAL', body);
    }

    @Post('ads')
    async proxyAds(@Body() body: any) {
        return this.proxyToN8n('N8N_WEBHOOK_URL_ADS', body);
    }

    @Post('seo')
    async proxySeo(@Body() body: any) {
        return this.proxyToN8n('N8N_WEBHOOK_URL_SEO', body);
    }
}
