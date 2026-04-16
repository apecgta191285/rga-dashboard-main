import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { google } from 'googleapis';

@Injectable()
export class GoogleAdsClientService {
  private readonly logger = new Logger(GoogleAdsClientService.name);

  constructor(private configService: ConfigService) {
    this.logger.log('🚀 [GoogleAdsClientService] Initialized with Smart-REST transport (v23)');
  }

  /**
   * 🔑 Get fresh Access Token
   */
  async getAccessToken(refreshToken: string): Promise<string> {
    const clientId = this.configService.get('GOOGLE_ADS_CLIENT_ID') || this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_ADS_CLIENT_SECRET') || this.configService.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Missing Google OAuth client credentials for Ads');
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    try {
      const { token } = await oauth2Client.getAccessToken();
      if (!token) throw new Error('Token is null or expired');
      return token;
    } catch (error: any) {
      this.logger.error(`[TOKEN] Failed refresh: ${error.message}`);
      throw new Error(`Failed to refresh Google OAuth token: ${error.message}`);
    }
  }

  /**
   * 🚀 executeRestCall: Universal fallback wrapper for Google Ads REST
   */
  private async executeRestCall(method: 'GET' | 'POST', path: string, refreshToken: string, data?: any, loginCustomerId?: string | null) {
    const accessToken = await this.getAccessToken(refreshToken);
    const devToken = this.configService.get('GOOGLE_ADS_DEVELOPER_TOKEN')?.trim().replace(/^"|"$/g, '');
    
    // Versions for April 2026
    const versions = ['v23', 'v22', 'v21', 'v20', 'v19'];
    let lastError: any = null;

    for (const ver of versions) {
      const url = `https://googleads.googleapis.com/${ver}/${path}`;
      try {
        const headers: any = {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': devToken,
          'Content-Type': 'application/json',
          'User-Agent': 'RGA-Dashboard-REST-Agent/1.0'
        };

        if (loginCustomerId) {
          headers['login-customer-id'] = loginCustomerId.replace(/-/g, '');
        }

        const config = { headers, timeout: 15000 };
        const response = (method === 'GET') ? await axios.get(url, config) : await axios.post(url, data || {}, config);
        return response.data;
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        if (status === 401 || status === 403) throw error; // Don't retry auth errors
      }
    }
    throw lastError || new Error(`Failed to reach Google Ads API: ${path}`);
  }

  /**
   * 🔎 Search metrics/campaigns
   */
  async rawRestQuery(customerId: string, refreshToken: string, query: string, loginCustomerId?: string | null) {
    const cleanId = customerId.replace(/-/g, '');
    const path = `customers/${cleanId}/googleAds:search`;
    const data = await this.executeRestCall('POST', path, refreshToken, { query }, loginCustomerId);
    return data?.results || [];
  }

  /**
   * 🔎 List Accessible Customers
   */
  async listAccessibleCustomers(refreshToken: string): Promise<string[]> {
    try {
      this.logger.log('[GoogleAdsAPI] Listing accessible customers (v23)...');
      const data = await this.executeRestCall('GET', 'customers:listAccessibleCustomers', refreshToken);
      return data?.resourceNames || [];
    } catch (error: any) {
      this.logger.error(`[GoogleAdsAPI] Failed listing: ${error.message}`);
      // Fallback to env if empty
      const loginCustomerId = this.configService.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID')?.replace(/-/g, '');
      return loginCustomerId ? [`customers/${loginCustomerId}`] : [];
    }
  }

  /**
   * 🔎 Flatten Accounts Hierarchy
   */
  async getAllSelectableAccounts(refreshToken: string): Promise<any[]> {
    this.logger.log(`[GET-ALL-ACCOUNTS] Starting scan...`);
    try {
      const accessibleCustomers = await this.listAccessibleCustomers(refreshToken);
      const allAccounts: any[] = [];

      for (const resourceName of accessibleCustomers) {
        const customerId = resourceName.replace('customers/', '');
        try {
          const selfQuery = `SELECT customer.id, customer.descriptive_name, customer.manager, customer.status FROM customer LIMIT 1`;
          const selfResult = await this.rawRestQuery(customerId, refreshToken, selfQuery, customerId);

          if (selfResult.length > 0) {
            const info = selfResult[0].customer;
            const isManager = info.manager || false;
            const accountName = info.descriptiveName || info.descriptive_name || `Account ${customerId}`;

            // Add the account itself
            if (!allAccounts.find(a => a.id === customerId)) {
              allAccounts.push({
                id: customerId,
                name: isManager ? `${accountName} (Manager)` : accountName,
                type: isManager ? 'MANAGER' : 'ACCOUNT',
                status: info.status || 'ENABLED',
              });
            }

            if (isManager) {
              const childQuery = `SELECT customer_client.id, customer_client.descriptive_name, customer_client.status FROM customer_client WHERE customer_client.manager = FALSE AND customer_client.status != 'CANCELLED'`;
              const children = await this.rawRestQuery(customerId, refreshToken, childQuery, customerId);

              if (children && Array.isArray(children)) {
                for (const row of children) {
                  const client = row.customerClient || row.customer_client;
                  if (client && client.id) {
                    const childId = client.id.toString();
                    if (!allAccounts.find(a => a.id === childId)) {
                      allAccounts.push({
                        id: childId,
                        name: client.descriptiveName || client.descriptive_name || `Account ${childId}`,
                        type: 'ACCOUNT',
                        parentMccId: customerId,
                        status: client.status || 'ENABLED',
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (e: any) {
          this.logger.warn(`Failed hierarchy scan for ${customerId}: ${e.message}`);
        }
      }
      return allAccounts;
    } catch (error: any) {
      this.logger.error(`Fatal error in getAllSelectableAccounts: ${error.message}`);
      throw error;
    }
  }

  async getClientAccounts(refreshToken: string, loginCustomerId: string) {
    const query = `
      SELECT customer_client.id, customer_client.descriptive_name, customer_client.status
      FROM customer_client
      WHERE customer_client.manager = FALSE
    `;
    const results = await this.rawRestQuery(loginCustomerId, refreshToken, query, loginCustomerId);
    
    return results.map((row: any) => {
      const client = row?.customerClient || row?.customer_client;
      if (!client || !client.id) {
        return {
          id: 'UNKNOWN',
          name: 'Unknown Account',
          status: 'UNKNOWN',
        };
      }
      return {
        id: client.id.toString(),
        name: client.descriptiveName || client.descriptive_name || `Account ${client.id}`,
        status: client.status || 'UNKNOWN',
      };
    });
  }

  async getAccessTokenFromCode(code: string): Promise<any> {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI_ADS'),
    );
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }
}
