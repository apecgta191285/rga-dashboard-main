import { Controller, Get, Param, Logger } from '@nestjs/common';
import { GoogleAdsApiService } from './services/google-ads-api.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('debug-ads')
export class GoogleAdsDebugController {
  private readonly logger = new Logger(GoogleAdsDebugController.name);

  constructor(
    private readonly apiService: GoogleAdsApiService,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * 🔎 ระบบวินิจฉัยพิเศษ: เข้าได้โดยไม่ต้อง Login และไม่ต้องมี /api/v1
   * เรียกใช้: https://[โดเมน]/debug-ads/:customerId
   */
  @Get(':customerId')
  async verifyApi(@Param('customerId') customerId: string) {
    const cleanId = customerId.replace(/-/g, '');
    this.logger.log(`[Diagnostic-ROOT] Verifying API for customer ${cleanId}`);
    
    // ค้นหาบัญชีแบบ Global (ไม่เช็ค Tenant เพื่อการวินิจฉัย)
    const account = await this.prisma.googleAdsAccount.findFirst({
        where: { customerId: cleanId }
    });

    if (!account) return { error: `Account ${cleanId} NOT FOUND in your Database!` };

    try {
        const results = await this.apiService.fetchCampaigns(account);
        return {
            success: true,
            accountInDb: { id: account.id, name: account.accountName, loginCustomerId: account.loginCustomerId },
            campaignCount: results.length,
            campaigns: results.map(c => ({ id: c.campaign.id, name: c.campaign.name, status: c.campaign.status }))
        };
    } catch (e) {
        return {
            success: false,
            error: e.message,
            stack: e.stack
        };
    }
  }
}
