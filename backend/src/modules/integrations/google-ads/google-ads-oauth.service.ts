import { Injectable, BadRequestException, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleAdsClientService } from './services/google-ads-client.service';
import { GoogleAdsCampaignService } from './google-ads-campaign.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';
import { UnifiedSyncService } from '../../sync/unified-sync.service';
import { AdPlatform } from '@prisma/client';
import { EncryptionService } from '../../../common/services/encryption.service';

@Injectable()
export class GoogleAdsOAuthService {
  private readonly logger = new Logger(GoogleAdsOAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly googleAdsClientService: GoogleAdsClientService,
    private readonly googleAdsCampaignService: GoogleAdsCampaignService,
    private readonly unifiedSyncService: UnifiedSyncService,
    private readonly encryptionService: EncryptionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  /**
   * Create a fresh OAuth2Client instance for each request
   * Prevents Singleton State Pollution / Race Conditions
   */
  private createOAuthClient() {
    return new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI_ADS'),
    );
  }

  async generateAuthUrl(userId: string, tenantId: string): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/adwords', // Google Ads API
    ];

    // Store state for verification
    const state = Buffer.from(
      JSON.stringify({ userId, tenantId, timestamp: Date.now() }),
    ).toString('base64');

    const oauth2Client = this.createOAuthClient();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: scopes,
      state: state,
      prompt: 'consent', // Force consent screen to get refresh token
    });

    return authUrl;
  }

  async handleCallback(code: string, state: string) {
    try {
      // Verify state
      const stateData = JSON.parse(
        Buffer.from(state, 'base64').toString('utf-8'),
      );
      const { userId, tenantId } = stateData;

      // Exchange code for tokens
      const oauth2Client = this.createOAuthClient();
      const { tokens } = await oauth2Client.getToken(code);

      // --- DIAGNOSTIC TRAP START ---
      try {
        if (tokens.refresh_token) {
          this.logger.log(`[OAuth Trap] ✅ Received Refresh Token`);
        } else {
          this.logger.warn(`[OAuth Trap] ⚠️ WARNING: No refresh_token received! Google did not send one.`);
        }
      } catch (e) {
        // ignore log error
      }
      // --- DIAGNOSTIC TRAP END ---

      if (!tokens.access_token) {
        throw new BadRequestException('Failed to get access token from Google');
      }
      if (!tokens.refresh_token) {
        throw new BadRequestException('ไม่ได้รับ Refresh Token จาก Google. กรุณาไปที่ Google Account -\u003E Security -\u003E Third-party apps และกด Remove Access ก่อนลองเชื่อมต่อใหม่อีกครั้ง');
      }

      // Fetch all selectable accounts using Option B (flatten all accessible accounts)
      let selectableAccounts: {
        id: string;
        name: string;
        type: 'ACCOUNT' | 'MANAGER';
        parentMccId?: string;
        parentMccName?: string;
        status: string;
      }[] = [];

      try {
        selectableAccounts = await this.googleAdsClientService.getAllSelectableAccounts(tokens.refresh_token);
        this.logger.log(`✅ Selectable Google Ads Accounts: ${JSON.stringify(selectableAccounts.map(a => ({ id: a.id, name: a.name })))}`);
      } catch (error: any) {
        this.logger.error(`❌ Failed to list Google Ads accounts`);
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error response status: ${error.response?.status}`);
        this.logger.error(`Error response data: ${JSON.stringify(error.response?.data)}`);

        // Provide more contextual error message
        let contextualMessage = error.message;
        if (error.response?.status === 400) {
          contextualMessage = `400 Bad Request - API returned error. Check: (1) Developer Token validity, (2) Google Ads API enabled, (3) Account has proper permissions`;
        } else if (error.response?.status === 401) {
          contextualMessage = `401 Unauthorized - Token may have expired or been revoked`;
        } else if (error.response?.status === 403) {
          contextualMessage = `403 Forbidden - Your account may not have permission to access Google Ads API`;
        }

        throw new BadRequestException(
          `ไม่สามารถดึง Google Ads Accounts ได้: ${contextualMessage}. กรุณาตรวจสอบว่า Developer Token ถูกต้องและ Google Ads API เปิดใช้งานแล้ว`
        );
      }

      if (!selectableAccounts || selectableAccounts.length === 0) {
        throw new BadRequestException(
          'ไม่พบ Google Ads Account ที่เข้าถึงได้. กรุณาตรวจสอบว่าบัญชี Google นี้มีสิทธิ์เข้าถึง Google Ads Account'
        );
      }

      // Generate temp token key
      const tempToken = uuidv4();

      // Store tokens in cache (10 minutes = 600000ms)
      await this.cacheManager.set(`google_ads_temp_tokens:${tempToken}`, tokens, 600000);

      // Store selectable accounts in cache (10 minutes = 600000ms)
      // Format: array of { id, name, type, parentMccId?, parentMccName?, status }
      await this.cacheManager.set(`google_ads_temp_accounts:${tempToken}`, selectableAccounts, 600000);

      return {
        status: 'select_account',
        accounts: selectableAccounts,
        tempToken: tempToken,
      };
    } catch (error) {
      this.logger.error('Error in handleCallback:', error);

      // DEBUG: Write error to a file so we can see what exactly failed for the user
      try {
        require('fs').appendFileSync('oauth_error.log', new Date().toISOString() + ' | OAuth Error: ' + error.stack + '\n');
      } catch (e) { }

      // Re-throw BadRequestException as-is, wrap others
      if (error instanceof BadRequestException) {
        throw new BadRequestException(`[NEW_DEBUG] ${error.message}`);
      }
      throw new BadRequestException(
        `[NEW_DEBUG] OAuth callback failed: ${error.message}`,
      );
    }
  }

  async getTempAccounts(tempToken: string) {
    const accounts = await this.cacheManager.get(`google_ads_temp_accounts:${tempToken}`);
    if (!accounts) {
      throw new BadRequestException('Session expired or invalid token');
    }
    return accounts;
  }

  async completeConnection(tempToken: string, customerId: string, tenantId: string) {
    this.logger.log(`[OAuth Connect] Starting connection for tenant=${tenantId}, customerId=${customerId}, tempToken=${tempToken?.substring(0, 8)}...`);

    const tokens = await this.cacheManager.get<any>(`google_ads_temp_tokens:${tempToken}`);

    if (!tokens || !tokens.refresh_token) {
      this.logger.error(`[OAuth Connect] ❌ Failed: tempToken not found or missing refresh_token in cache`);
      throw new BadRequestException('ไม่พบข้อมูลการยืนยันตัวตน หรือ Session หมดอายุ กรุณาเริ่มขั้นตอนเชื่อต่อใหม่อีกครั้ง');
    }

    const refreshToken = tokens.refresh_token;
    const accessToken = tokens.access_token;
    const tokenExpiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    const cachedAccounts = await this.cacheManager.get<any[]>(`google_ads_temp_accounts:${tempToken}`);
    if (!cachedAccounts) {
      this.logger.warn(`[OAuth Connect] ⚠️ Warning: cachedAccounts not found for tempToken`);
    }

    const selectedAccount = cachedAccounts?.find(acc => acc.id === customerId);
    const accountName = selectedAccount?.name || `Account ${customerId}`;
    const parentMccId = selectedAccount?.parentMccId || null;
    const isMccAccount = selectedAccount?.type === 'MANAGER' ? true : false;

    // Ensure customerId is clean (no "customers/" prefix or dashes)
    const cleanCustomerId = customerId.replace('customers/', '').replace(/-/g, '');

    // Check if exists
    const existing = await this.prisma.googleAdsAccount.findFirst({
      where: { tenantId, customerId: cleanCustomerId }
    });

    let accountId: string;

    try {
      if (existing) {
        this.logger.log(`[OAuth Connect] Updating existing account: ${existing.id}`);
        await this.prisma.googleAdsAccount.update({
          where: { id: existing.id },
          data: {
            refreshToken: this.encryptionService.encrypt(refreshToken),
            accountName,
            loginCustomerId: parentMccId,
            isMccAccount,
            status: 'ENABLED',
            updatedAt: new Date()
          }
        });
        accountId = existing.id;
      } else {
        this.logger.log(`[OAuth Connect] Creating new account for customerId: ${cleanCustomerId}`);
        const newAccount = await this.prisma.googleAdsAccount.create({
          data: {
            customerId: cleanCustomerId,
            accountName,
            loginCustomerId: parentMccId,
            isMccAccount,
            refreshToken: this.encryptionService.encrypt(refreshToken),
            status: 'ENABLED',
            tenantId: tenantId,
            accessToken: accessToken ? this.encryptionService.encrypt(accessToken) : 'placeholder',
            tokenExpiresAt: tokenExpiresAt,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        accountId = newAccount.id;
      }
    } catch (dbError: any) {
      this.logger.error(`[OAuth Connect] ❌ Database error: ${dbError.message}`);
      throw new BadRequestException(`บันทึกข้อมูลไม่สำเร็จ: ${dbError.message}`);
    }

    // Clear cache only after successful DB update
    try {
      await this.cacheManager.del(`google_ads_temp_tokens:${tempToken}`);
      await this.cacheManager.del(`google_ads_temp_accounts:${tempToken}`);
    } catch (e) {}

    // 🚀 Trigger Initial Sync in BACKGROUND (non-blocking) to prevent timeouts
    // This solves the issue where the request feels like it failed but actually succeeded
    this.triggerInitialSync(accountId, tenantId).catch(err => 
      this.logger.error(`[OAuth Connect] Background sync launch failed: ${err.message}`)
    );

    return {
      success: true,
      accountId,
      message: 'เชื่อมต่อบัญชีสำเร็จแล้ว ระบบกำลังเริ่มดึงข้อมูลในพื้นหลัง',
    };
  }

  /**
   * Trigger Initial Sync for newly connected account (non-blocking)
   */
  private async triggerInitialSync(accountId: string, tenantId: string) {
    try {
      this.logger.log(`[Initial Sync] Starting sync for account ${accountId}`);

      // Create SyncLog entry
      const syncLog = await this.prisma.syncLog.create({
        data: {
          tenantId,
          platform: AdPlatform.GOOGLE_ADS,
          accountId,
          syncType: 'INITIAL',
          status: 'STARTED',
          startedAt: new Date(),
        }
      });

      // Run sync using Unified Engine
      await this.unifiedSyncService.syncAccount(AdPlatform.GOOGLE_ADS, accountId, tenantId);

      // Update SyncLog
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        }
      });

      this.logger.log(`[Initial Sync] Completed for account ${accountId}`);
    } catch (error) {
      this.logger.error(`[Initial Sync] Failed for account ${accountId}: ${error.message}`);

      // Try to update SyncLog with error
      try {
        await this.prisma.syncLog.updateMany({
          where: { accountId, status: 'STARTED' },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
            completedAt: new Date(),
          }
        });
      } catch (e) {
        this.logger.error(`[Initial Sync] Failed to update SyncLog: ${e.message}`);
      }
    }
  }


  /**
   * Save all client accounts from Manager Account to database
   * Optimized to avoid N+1 queries
   */
  async saveClientAccounts(refreshToken: string, userId: string, tenantId: string, loginCustomerId: string) {
    try {
      // Log accessible customers for debugging
      try {
        const accessible = await this.googleAdsClientService.listAccessibleCustomers(refreshToken);
        this.logger.debug(`Accessible Customers for this user: ${JSON.stringify(accessible)}`);
      } catch (e) {
        this.logger.warn(`Failed to list accessible customers: ${e.message}`);
      }

      // 1. Get client accounts from Google Ads
      const clientAccounts = await this.googleAdsClientService.getClientAccounts(refreshToken, loginCustomerId);
      this.logger.log(`Found ${clientAccounts.length} client accounts for user ${userId}`);

      if (clientAccounts.length === 0) {
        return [];
      }

      // 2. Fetch existing accounts in bulk
      const customerIds = clientAccounts.map(a => a.id);
      const existingAccounts = await this.prisma.googleAdsAccount.findMany({
        where: {
          tenantId,
          customerId: { in: customerIds },
        },
      });

      const existingMap = new Map(existingAccounts.map(a => [a.customerId, a]));
      const operations = [];

      // 3. Prepare operations
      for (const account of clientAccounts) {
        const existing = existingMap.get(account.id);

        if (existing) {
          // Update
          operations.push(
            this.prisma.googleAdsAccount.update({
              where: { id: existing.id },
              data: {
                accountName: account.name,
                loginCustomerId: loginCustomerId,
                isMccAccount: false,
                refreshToken: this.encryptionService.encrypt(refreshToken),
                status: account.status,
                updatedAt: new Date(),
              },
            })
          );
        } else {
          // Create
          operations.push(
            this.prisma.googleAdsAccount.create({
              data: {
                customerId: account.id,
                accountName: account.name,
                loginCustomerId: loginCustomerId,
                isMccAccount: false,
                refreshToken: this.encryptionService.encrypt(refreshToken),
                status: account.status,
                tenantId: tenantId,
                accessToken: 'placeholder',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            })
          );
        }
      }

      // 4. Execute transaction
      const results = await this.prisma.$transaction(operations);
      this.logger.log(`Processed ${results.length} accounts (Created/Updated)`);

      return results;
    } catch (error) {
      this.logger.error('Failed to save client accounts:', error);
      throw new Error(`Failed to save client accounts: ${error.message}`);
    }
  }

  async getConnectedAccounts(tenantId: string) {
    const accounts = await this.prisma.googleAdsAccount.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        customerId: true,
        accountName: true,
        status: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      accounts: accounts,
      count: accounts.length,
    };
  }

  async getAccessToken(tenantId: string, customerId: string): Promise<string> {
    // Use findFirst instead of compound unique key
    const account = await this.prisma.googleAdsAccount.findFirst({
      where: {
        tenantId,
        customerId,
      },
    });

    if (!account) {
      throw new BadRequestException('Google Ads account not found');
    }

    // Check if token is expired (or close to expiring in 5 mins)
    const now = new Date();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes

    // If no expiry date OR expired OR about to expire
    if (!account.tokenExpiresAt || (account.tokenExpiresAt.getTime() - expiryBuffer) < now.getTime()) {

      this.logger.log(`[Token Refresh] Refreshing token for account ${customerId} (Expires: ${account.tokenExpiresAt})`);

      const oauth2Client = this.createOAuthClient();

      oauth2Client.setCredentials({
        refresh_token: this.encryptionService.decrypt(account.refreshToken),
      });

      try {
        const { credentials } = await oauth2Client.refreshAccessToken();

        // Update in database
        await this.prisma.googleAdsAccount.update({
          where: { id: account.id },
          data: {
            accessToken: this.encryptionService.encrypt(credentials.access_token),
            tokenExpiresAt: credentials.expiry_date
              ? new Date(credentials.expiry_date)
              : null,
          },
        });

        return credentials.access_token;
      } catch (error) {
        this.logger.error(`[Token Refresh] Failed: ${error.message}`);
        throw error;
      }
    }

    return this.encryptionService.decrypt(account.accessToken);
  }

  async disconnect(tenantId: string) {
    // First, soft delete all campaigns for this tenant and platform GOOGLE_ADS
    await this.prisma.campaign.updateMany({
      where: {
        tenantId,
        platform: 'GOOGLE_ADS',
        status: { not: 'DELETED' },
      },
      data: {
        status: 'DELETED',
      },
    });

    // Then, delete all accounts for this tenant
    await this.prisma.googleAdsAccount.deleteMany({
      where: { tenantId }
    });
    return true;
  }
}
