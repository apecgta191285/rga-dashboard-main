import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { google } from 'googleapis';

@Injectable()
export class GoogleAdsClientService {
  private readonly logger = new Logger(GoogleAdsClientService.name);

  constructor(private configService: ConfigService) {
    this.logger.log('🚀 [GoogleAdsClientService] Initialized with Smart-REST transport');
  }

  /**
   * 🔑 Get fresh Access Token
   */
  async getAccessToken(refreshToken: string): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { token } = await oauth2Client.getAccessToken();
    if (!token) throw new Error('Failed to obtain access token from Google');
    return token;
  }

  /**
   * 🚀 executeRestCall: Universal fallback wrapper for Google Ads REST
   */
  private async executeRestCall(method: 'GET' | 'POST', path: string, refreshToken: string, data?: any, loginCustomerId?: string | null) {
    const accessToken = await this.getAccessToken(refreshToken);
    const devToken = this.configService.get('GOOGLE_ADS_DEVELOPER_TOKEN')?.trim().replace(/^"|"$/g, '');

    if (!devToken) {
      this.logger.error('[GoogleAdsAPI] ⛔ FATAL: GOOGLE_ADS_DEVELOPER_TOKEN is missing or empty!');
    } else {
      this.logger.debug(`[GoogleAdsAPI] Using dev token starting with: ${devToken.substring(0, 3)}...`);
    }

    // Try multiple hostnames and versions until success
    // v15 added as it was extremely stable for older connections
    const hosts = ['googleads.googleapis.com', 'google-ads.googleapis.com'];
    const versions = ['v18', 'v17', 'v16', 'v15'];

    let lastError: any = null;

    for (const host of hosts) {
      for (const ver of versions) {
        const url = `https://${host}/${ver}/${path}`;

        try {
          const headers: any = {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': devToken,
            'Content-Type': 'application/json',
          };
          if (loginCustomerId) {
            headers['login-customer-id'] = loginCustomerId.replace(/-/g, '');
          }

          // Diagnostic tagging
          headers['User-Agent'] = 'RGA-Dashboard-REST-Agent/1.0';

          const config: any = { headers, timeout: 15000 };

          this.logger.debug(`[GoogleAdsAPI] Calling ${method} ${url}`);

          let response;
          if (method === 'GET') {
            response = await axios.get(url, config);
          } else {
            response = await axios.post(url, data || {}, config);
          }

          return response.data;
        } catch (error: any) {
          lastError = error;
          const status = error.response?.status;
          const errorJson = error.response?.data ? JSON.stringify(error.response.data) : 'No data';

          this.logger.error(`[GoogleAdsAPI-ERROR] ${host}/${ver}/${path} | Status: ${status} | Response: ${errorJson}`);

          // If it's a 401/403, the URL is CORRECT, but tokens are the issue. Don't retry.
          if (status === 401 || status === 403) {
            throw error;
          }
        }
      }
    }

    throw lastError || new Error(`Failed to reach Google Ads API across all versions and hosts: ${path}`);
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
   * Using the official-style library for more robustness
   */
  async listAccessibleCustomers(refreshToken: string): Promise<string[]> {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
    const developerToken = this.configService.get('GOOGLE_ADS_DEVELOPER_TOKEN')?.trim().replace(/^"|"$/g, '');
    const loginCustomerId = this.configService.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID')?.replace(/-/g, '');

    this.logger.log(`[GoogleAdsAPI-DIAG] listAccessibleCustomers | clientId=${clientId?.substring(0, 15)}... | devToken length=${developerToken?.length} | loginCustomerId=${loginCustomerId}`);

    if (!clientId || !clientSecret || !developerToken) {
      throw new Error('Config missing: ตรวจสอบไฟล์ .env บน Server ว่ามี CLIENT_ID, SECRET และ DEVELOPER_TOKEN หรือยัง');
    }

    let customers: string[] = [];

    // --- Attempt 1: Use google-ads-api library ---
    try {
      this.logger.log('[GoogleAdsAPI] Attempting via google-ads-api library...');
      const { GoogleAdsApi } = require('google-ads-api');
      const client = new GoogleAdsApi({
        client_id: clientId,
        client_secret: clientSecret,
        developer_token: developerToken,
      });
      const result = await client.listAccessibleCustomers(refreshToken);
      this.logger.log(`[GoogleAdsAPI] Library returned ${result?.length ?? 0} customers: ${JSON.stringify(result)}`);
      if (Array.isArray(result) && result.length > 0) {
        customers = result;
      }
    } catch (libErr: any) {
      this.logger.warn(`[GoogleAdsAPI] Library attempt failed: ${libErr.message}`);
    }

    // --- Attempt 2: Use REST API directly ---
    if (customers.length === 0) {
      try {
        this.logger.log('[GoogleAdsAPI] Attempting via REST customers:listAccessibleCustomers...');
        const data = await this.executeRestCall('GET', 'customers:listAccessibleCustomers', refreshToken, null, loginCustomerId || null);
        const resourceNames = data?.resourceNames || [];
        this.logger.log(`[GoogleAdsAPI] REST returned ${resourceNames.length} customers: ${JSON.stringify(resourceNames)}`);
        if (resourceNames.length > 0) {
          customers = resourceNames;
        }
      } catch (restErr: any) {
        this.logger.warn(`[GoogleAdsAPI] REST attempt failed: ${restErr.message}`);
      }
    }

    // --- Attempt 3: Fallback to env LOGIN_CUSTOMER_ID ---
    if (customers.length === 0 && loginCustomerId) {
      this.logger.warn(`[GoogleAdsAPI] ⚠️ All API calls returned empty. Using env fallback: customers/${loginCustomerId}`);
      customers = [`customers/${loginCustomerId}`];
    }

    if (customers.length === 0) {
      this.logger.error(`[GoogleAdsAPI] ❌ No accessible customers found via any method. Check: (1) Developer Token approved status, (2) Google account has Google Ads access, (3) GOOGLE_ADS_LOGIN_CUSTOMER_ID in .env`);
    }

    return customers;
  }

  async getClientAccounts(refreshToken: string, loginCustomerId: string) {
    const query = `
      SELECT customer_client.id, customer_client.descriptive_name, customer_client.status
      FROM customer_client
      WHERE customer_client.manager = FALSE
    `;
    const results = await this.rawRestQuery(loginCustomerId, refreshToken, query, loginCustomerId);

    return results.map((row: any) => {
      const client = row.customerClient || row.customer_client;
      return {
        id: client.id.toString(),
        name: client.descriptiveName || client.descriptive_name || `Account ${client.id}`,
        status: client.status || 'UNKNOWN',
      };
    });
  }

  /**
   * 🔎 Flatten Accounts Hierarchy
   */
  async getAllSelectableAccounts(refreshToken: string): Promise<any[]> {
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

            if (isManager) {
              const childQuery = `SELECT customer_client.id, customer_client.descriptive_name, customer_client.status FROM customer_client WHERE customer_client.manager = FALSE`;
              const children = await this.rawRestQuery(customerId, refreshToken, childQuery, customerId);

              for (const row of children) {
                const client = row.customerClient || row.customer_client;
                const childId = client.id.toString();
                if (!allAccounts.find(a => a.id === childId)) {
                  allAccounts.push({
                    id: childId,
                    name: client.descriptiveName || client.descriptive_name || `Account ${childId}`,
                    type: 'ACCOUNT',
                    parentMccId: customerId,
                    status: client.status || 'ENABLED'
                  });
                }
              }
            } else {
              const cust = selfResult[0].customer;
              if (!allAccounts.find(a => a.id === customerId)) {
                allAccounts.push({
                  id: customerId,
                  name: cust.descriptiveName || cust.descriptive_name || `Account ${customerId}`,
                  type: 'ACCOUNT',
                  status: cust.status || 'ENABLED'
                });
              }
            }
          } else {
            // Fallback: If query returned no rows but account was in accessible list
            allAccounts.push({
              id: customerId,
              name: `Account ${customerId} (Details unavailable)`,
              type: 'ACCOUNT',
              status: 'UNKNOWN'
            });
          }
        } catch (e) {
          this.logger.warn(`Failed to scan hierarchy for ${customerId}: ${e.message}`);
          // Fallback: Add basic account info even if query failed
          allAccounts.push({
            id: customerId,
            name: `Account ${customerId} (Unverified)`,
            type: 'ACCOUNT',
            status: 'UNKNOWN'
          });
        }
      }
      return allAccounts;
    } catch (error) {
      this.logger.error(`[GoogleAdsClientService] getAllSelectableAccounts fatal error: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔑 Exchange OAuth code for tokens
   */
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
