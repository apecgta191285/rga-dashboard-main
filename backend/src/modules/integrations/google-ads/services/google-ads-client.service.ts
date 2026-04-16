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
      
      // Try v19 and v18 — Google Ads API deprecated v17 and below as of 2025
      const hosts = ['googleads.googleapis.com'];
      const versions = ['v19', 'v18'];
      
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
   * Direct REST call (the approach that previously worked), with library fallback
   */
  async listAccessibleCustomers(refreshToken: string): Promise<string[]> {
    const developerToken = this.configService.get('GOOGLE_ADS_DEVELOPER_TOKEN')?.trim().replace(/^"|"$/g, '');
    const loginCustomerId = this.configService.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID')?.replace(/-/g, '');

    this.logger.log(`[GoogleAdsAPI-DIAG] listAccessibleCustomers | devToken length=${developerToken?.length} | loginCustomerId=${loginCustomerId}`);

    if (!developerToken) {
      throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is missing from .env');
    }

    let customers: string[] = [];

    // --- Attempt 1: Direct REST call to v19 (most reliable, previously working approach) ---
    try {
      this.logger.log('[GoogleAdsAPI] Attempt 1: REST GET customers:listAccessibleCustomers (v19)...');
      const accessToken = await this.getAccessToken(refreshToken);
      
      const headers: any = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      };
      // Only include login-customer-id header when it's set — omitting it is correct for plain accounts
      if (loginCustomerId) {
        headers['login-customer-id'] = loginCustomerId;
      }

      const url = 'https://googleads.googleapis.com/v19/customers:listAccessibleCustomers';
      this.logger.log(`[GoogleAdsAPI] GET ${url}`);
      const response = await axios.get(url, { headers, timeout: 15000 });
      const resourceNames: string[] = response.data?.resourceNames || [];
      this.logger.log(`[GoogleAdsAPI] Attempt 1 SUCCESS: ${resourceNames.length} customers: ${JSON.stringify(resourceNames)}`);
      if (resourceNames.length > 0) {
        customers = resourceNames;
      }
    } catch (restErr: any) {
      const status = restErr.response?.status;
      const errorData = JSON.stringify(restErr.response?.data);
      this.logger.warn(`[GoogleAdsAPI] Attempt 1 FAILED: status=${status} | ${errorData} | ${restErr.message}`);
    }

    // --- Attempt 2: google-ads-api library ---
    if (customers.length === 0) {
      try {
        this.logger.log('[GoogleAdsAPI] Attempt 2: google-ads-api library...');
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
        const { GoogleAdsApi } = require('google-ads-api');
        const client = new GoogleAdsApi({
          client_id: clientId,
          client_secret: clientSecret,
          developer_token: developerToken,
        });
        const result = await client.listAccessibleCustomers(refreshToken);
        this.logger.log(`[GoogleAdsAPI] Attempt 2 returned: ${JSON.stringify(result)}`);
        if (Array.isArray(result) && result.length > 0) {
          customers = result;
        }
      } catch (libErr: any) {
        this.logger.warn(`[GoogleAdsAPI] Attempt 2 FAILED: ${libErr.message}`);
      }
    }

    // --- Attempt 3: Fallback to executeRestCall with version cycling ---
    if (customers.length === 0) {
      try {
        this.logger.log('[GoogleAdsAPI] Attempt 3: executeRestCall fallback...');
        const data = await this.executeRestCall('GET', 'customers:listAccessibleCustomers', refreshToken, null, loginCustomerId || null);
        const resourceNames = data?.resourceNames || [];
        this.logger.log(`[GoogleAdsAPI] Attempt 3 returned: ${JSON.stringify(resourceNames)}`);
        if (resourceNames.length > 0) {
          customers = resourceNames;
        }
      } catch (restErr: any) {
        this.logger.warn(`[GoogleAdsAPI] Attempt 3 FAILED: ${restErr.message}`);
      }
    }

    // --- Fallback: Use env LOGIN_CUSTOMER_ID ---
    if (customers.length === 0 && loginCustomerId) {
      this.logger.warn(`[GoogleAdsAPI] ⚠️ All attempts returned empty. Using env fallback: customers/${loginCustomerId}`);
      customers = [`customers/${loginCustomerId}`];
    }

    if (customers.length === 0) {
      this.logger.error(`[GoogleAdsAPI] ❌ No accessible customers found. Possible causes:\n  1. Developer Token not approved (check Google Ads API Center)\n  2. Google account has no access to any Google Ads account\n  3. GOOGLE_ADS_LOGIN_CUSTOMER_ID not set in .env`);
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
