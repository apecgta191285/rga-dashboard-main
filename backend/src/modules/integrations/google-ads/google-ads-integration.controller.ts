import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, Delete, Req, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GoogleAdsOAuthService } from './google-ads-oauth.service';
import { UnifiedSyncService } from '../../sync/unified-sync.service';
import { GoogleAdsApiService } from './services/google-ads-api.service';
import { AdPlatform } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('integrations/google-ads')
@Controller('integrations/google-ads')
@ApiBearerAuth()
export class GoogleAdsIntegrationController {
  private readonly logger = new Logger(GoogleAdsIntegrationController.name);

  constructor(
    private readonly oauthService: GoogleAdsOAuthService,
    private readonly unifiedSyncService: UnifiedSyncService,
    private readonly apiService: GoogleAdsApiService,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * 🔎 ระบบวินิจฉัย: ตรวจสอบความถูกต้องของ API โดยตรง
   * เรียกใช้: /api/v1/integrations/google-ads/debug/verify/:customerId
   */
  @Get('debug/verify/:customerId')
  @UseGuards(JwtAuthGuard)
  async verifyApi(@Param('customerId') customerId: string, @Req() req: any) {
    this.logger.log(`[Diagnostic] Verifying API for tenant ${req.user.tenantId}, customer ${customerId}`);
    
    // ค้นหาบัญชีใน DB ก่อน
    const account = await this.prisma.googleAdsAccount.findFirst({
        where: { tenantId: req.user.tenantId, customerId: customerId.replace(/-/g, '') }
    });

    if (!account) return { error: `Account ${customerId} not found in database for your tenant.` };

    try {
        const results = await this.apiService.fetchCampaigns(account);
        return {
            success: true,
            accountInDb: { id: account.id, name: account.accountName },
            campaignCount: results.length,
            sampleData: results.slice(0, 2)
        };
    } catch (e) {
        return {
            success: false,
            error: e.message,
            stack: e.stack
        };
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check Google Ads integration status' })
  async getStatus(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const result = await this.oauthService.getConnectedAccounts(tenantId);

    const mappedAccounts = result.accounts.map(account => ({
      id: account.id,
      externalId: account.customerId,
      name: account.accountName || 'Unnamed Account',
      status: account.status,
    }));

    const lastSyncAt = result.accounts.length > 0
      ? result.accounts
        .map(a => a.lastSyncAt)
        .filter(Boolean)
        .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0] || null
      : null;

    return {
      isConnected: result.accounts.length > 0,
      lastSyncAt,
      accounts: mappedAccounts,
    };
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Google Ads OAuth authorization URL' })
  async getAuthUrl(@Request() req) {
    const url = await this.oauthService.generateAuthUrl(
      req.user.id,
      req.user.tenantId,
    );
    return { url };
  }

  @Post('oauth/callback')
  @ApiOperation({ summary: 'Handle OAuth callback' })
  async handleCallback(
    @Body('code') code: string,
    @Body('state') state: string,
  ) {
    return this.oauthService.handleCallback(code, state);
  }

  @Get('temp-accounts')
  @ApiOperation({ summary: 'Get temporary accounts for selection' })
  async getTempAccounts(@Query('tempToken') tempToken: string) {
    return this.oauthService.getTempAccounts(tempToken);
  }

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Connect a Google Ads account' })
  async connectAccount(
    @Body('tempToken') tempToken: string,
    @Body('customerId') customerId: string,
    @Request() req,
  ) {
    return this.oauthService.completeConnection(
      tempToken,
      customerId,
      req.user.tenantId,
    );
  }

  @Get('accounts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get connected accounts' })
  async getConnectedAccounts(@Request() req) {
    return this.oauthService.getConnectedAccounts(req.user.tenantId);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disconnect Google Ads integration' })
  async disconnect(@Request() req) {
    return this.oauthService.disconnect(req.user.tenantId);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Trigger manual sync for Google Ads' })
  async triggerSync(@Request() req) {
    const tenantId = req.user.tenantId;
    const result = await this.oauthService.getConnectedAccounts(tenantId);

    if (result.accounts.length === 0) {
      throw new BadRequestException('No Google Ads account connected');
    }

    const syncResults = [];
    for (const account of result.accounts) {
      // 🚀 Force sequential sync for stability on Hostinger
      await this.unifiedSyncService.syncAccount(AdPlatform.GOOGLE_ADS, account.id, tenantId);
      syncResults.push({ accountId: account.id, status: 'COMPLETED' });
    }

    return {
      success: true,
      message: 'Sync completed for all connected accounts',
      results: syncResults
    };
  }
}
