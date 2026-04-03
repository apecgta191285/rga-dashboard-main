// backend/src/modules/ai/ai-webhook.controller.ts
import { HttpService } from '@nestjs/axios';
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';

@Controller('api/ai/webhook')
export class AiWebhookController {
    constructor(private http: HttpService) { }

    private async proxyToN8n(webhookEnv: string, body: any) {
        const webhookUrl = process.env[webhookEnv];

        if (!webhookUrl) {
            throw new HttpException('N8N_WEBHOOK_URL_GENERAL is not configured', HttpStatus.SERVICE_UNAVAILABLE);
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
        } catch (error: any) {
            // Try to forward upstream status and message when available (e.g., 429)
            const upstreamStatus = error?.response?.status || HttpStatus.BAD_GATEWAY;
            const upstreamData = error?.response?.data;
            const message = (upstreamData && (upstreamData.message || upstreamData.error || JSON.stringify(upstreamData)))
                || error?.message || 'Webhook error';

            console.error('Webhook error:', message);
            throw new HttpException({ error: message }, upstreamStatus);
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
