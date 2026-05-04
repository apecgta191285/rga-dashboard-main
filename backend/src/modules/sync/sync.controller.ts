import { BadRequestException, Controller, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdPlatform } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { UnifiedSyncService } from './unified-sync.service';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
    constructor(
        private readonly unifiedSyncService: UnifiedSyncService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('all')
    @ApiOperation({ summary: 'Trigger manual sync for all platforms (tenant-scoped)' })
    async syncAll(@CurrentUser('tenantId') tenantId: string) {
        return this.unifiedSyncService.syncAllForTenant(tenantId);
    }

    @Post('platform/:platform')
    @ApiOperation({ summary: 'Trigger manual sync for a platform (tenant-scoped)' })
    async syncPlatform(
        @CurrentUser('tenantId') tenantId: string,
        @Param('platform') platform: string,
    ) {
        const normalized = platform.replace(/-/g, '_').toUpperCase();
        if (!(normalized in AdPlatform)) {
            throw new BadRequestException(`Invalid platform: ${platform}`);
        }

        return this.unifiedSyncService.syncPlatformForTenant(normalized as AdPlatform, tenantId);
    }

    @Post(':platform/accounts/:accountId')
    @ApiOperation({ summary: 'Trigger manual sync for a specific account (tenant-scoped)' })
    @ApiQuery({ name: 'lookbackDays', required: false, description: 'Optional number of days to backfill metric sync, e.g. 30 or 90.' })
    async syncAccount(
        @CurrentUser('tenantId') tenantId: string,
        @Param('platform') platform: string,
        @Param('accountId') accountId: string,
        @Query('lookbackDays') lookbackDays?: string,
    ) {
        const normalized = platform.toUpperCase();
        if (!(normalized in AdPlatform)) {
            throw new BadRequestException(`Invalid platform: ${platform}`);
        }

        const parsedLookback = lookbackDays ? Number(lookbackDays) : undefined;
        if (lookbackDays && (!Number.isFinite(parsedLookback) || parsedLookback <= 0)) {
            throw new BadRequestException('lookbackDays must be a positive integer');
        }

        await this.assertAccountOwnership(normalized as AdPlatform, accountId, tenantId);
        await this.unifiedSyncService.syncAccount(
            normalized as AdPlatform,
            accountId,
            tenantId,
            undefined,
            parsedLookback,
        );

        return { success: true, message: 'Sync started' };
    }

    private async assertAccountOwnership(platform: AdPlatform, accountId: string, tenantId: string) {
        switch (platform) {
            case AdPlatform.GOOGLE_ADS: {
                const account = await this.prisma.googleAdsAccount.findFirst({ where: { id: accountId, tenantId } });
                if (!account) throw new BadRequestException('Account not found for this tenant');
                return;
            }
            case AdPlatform.FACEBOOK: {
                const account = await this.prisma.facebookAdsAccount.findFirst({ where: { id: accountId, tenantId } });
                if (!account) throw new BadRequestException('Account not found for this tenant');
                return;
            }
            case AdPlatform.GOOGLE_ANALYTICS: {
                const account = await this.prisma.googleAnalyticsAccount.findFirst({ where: { id: accountId, tenantId } });
                if (!account) throw new BadRequestException('Account not found for this tenant');
                return;
            }
            case AdPlatform.TIKTOK: {
                const account = await this.prisma.tikTokAdsAccount.findFirst({ where: { id: accountId, tenantId } });
                if (!account) throw new BadRequestException('Account not found for this tenant');
                return;
            }
            case AdPlatform.LINE_ADS: {
                const account = await this.prisma.lineAdsAccount.findFirst({ where: { id: accountId, tenantId } });
                if (!account) throw new BadRequestException('Account not found for this tenant');
                return;
            }
            default:
                throw new BadRequestException(`Platform not supported: ${platform}`);
        }
    }
}
