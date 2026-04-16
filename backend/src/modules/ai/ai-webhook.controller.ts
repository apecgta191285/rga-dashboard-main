// backend/src/modules/ai/ai-webhook.controller.ts
import { HttpService } from '@nestjs/axios';
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';

@Controller('api/ai/webhook')
export class AiWebhookController {
    constructor(private http: HttpService) { }

    private formatN8nResponse(n8nData: any) {
        const extractJson = (text: string): any => {
            if (!text) return null;
            let message = text
                .replace(/```(?:json)?\s*/g, '')
                .replace(/```\s*/g, '')
                .trim()
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t');

            try {
                return JSON.parse(message);
            } catch {
                const patterns = [
                    /\{[\s\S]*\}/,
                    /\{(?:[^{}]|\{[^{}]*\})*\}/,
                    /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/
                ];

                for (const pattern of patterns) {
                    const match = message.match(pattern);
                    if (match) {
                        try {
                            const cleanJson = match[0]
                                .replace(/\\n/g, '\n')
                                .replace(/\\r/g, '\r')
                                .replace(/\\t/g, '\t');
                            return JSON.parse(cleanJson);
                        } catch {
                            continue;
                        }
                    }
                }
            }

            return null;
        };

        const normalize = (value: any): any => {
            if (value == null) {
                return value;
            }
            if (Array.isArray(value)) {
                return normalize(value[0]);
            }
            if (typeof value !== 'object') {
                return value;
            }
            if ('json' in value) {
                return normalize(value.json);
            }
            if ('data' in value) {
                return normalize(value.data);
            }
            if ('body' in value) {
                return normalize(value.body);
            }
            if ('payload' in value) {
                return normalize(value.payload);
            }
            if ('response' in value && typeof value.response !== 'string') {
                return normalize(value.response);
            }
            return value;
        };

        let payload = normalize(n8nData);

        if (typeof payload === 'string') {
            const parsedFromString = extractJson(payload);
            if (parsedFromString) {
                payload = parsedFromString;
            }
        }

        const rawAnswer =
            payload?.text ||
            payload?.response?.text ||
            payload?.content ||
            payload?.data?.text ||
            payload?.output ||
            payload?.reply ||
            payload?.message;

        let message = '';
        if (rawAnswer) {
            message = typeof rawAnswer === 'string' ? rawAnswer : JSON.stringify(rawAnswer);
        } else if (typeof payload === 'string') {
            message = payload;
        }

        let parsed = null;
        if (message) {
            parsed = extractJson(message);
        }

        if (!parsed && payload && typeof payload === 'object') {
            if (payload.summaryCards || payload.sections || payload.insight) {
                parsed = payload;
            } else if (payload.parts && payload.parts[0]?.text) {
                parsed = extractJson(payload.parts[0].text) || payload.parts[0].text;
            } else if (payload.json && typeof payload.json === 'object') {
                parsed = payload.json;
            }
        }

        return {
            parsed,
            raw: payload,
            message: parsed ? JSON.stringify(parsed) : message || undefined,
        };
    }

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

            const normalized = this.formatN8nResponse(n8nData);
            const reply = normalized.message || 'No response';
            const data = normalized.parsed ?? normalized.raw ?? {};

            return {
                success: true,
                message: reply,
                data,
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

    @Post('summary')
    async proxySummary(@Body() body: any) {
        return this.proxyToN8n('N8N_WEBHOOK_URL_SUMMARY', body);
    }
}
