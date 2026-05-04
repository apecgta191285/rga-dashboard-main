import { Controller, Delete, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GoogleAnalyticsService } from './google-analytics.service';
import { GoogleAnalyticsOAuthService } from './google-analytics-oauth.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('integrations/google-analytics')
@Controller('integrations/google-analytics')
export class GoogleAnalyticsDataController {
    constructor(
        private readonly analyticsService: GoogleAnalyticsService,
        private readonly oauthService: GoogleAnalyticsOAuthService,
    ) { }

    @Get('status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get GA4 connection status' })
    async getStatus(
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.oauthService.getConnectionStatus(tenantId);
    }

    @Delete()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Disconnect Google Analytics integration' })
    @ApiResponse({
        status: 200,
        description: 'Google Analytics disconnected successfully',
        schema: {
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Google Analytics disconnected successfully' },
            },
        },
    })
    async disconnect(@Req() req: any) {
        await this.oauthService.disconnect(req.user.tenantId);
        return {
            success: true,
            message: 'Google Analytics disconnected successfully',
        };
    }

    @Get('basic')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get basic GA4 metrics' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async getBasicMetrics(
        @CurrentUser('tenantId') tenantId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.analyticsService.getBasicMetrics(tenantId, startDate, endDate);
    }
}
