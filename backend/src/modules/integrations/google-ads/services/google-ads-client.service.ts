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

    // --- Attempt 1: Direct REST call to v19 ---
    // ⚠️ IMPORTANT: Do NOT include login-customer-id header here.
    // customers:listAccessibleCustomers returns ALL accounts the user can access.
    // Adding login-customer-id scopes results to ONE MCC only, hiding other accounts.
    try {
      this.logger.log('[GoogleAdsAPI] Attempt 1: REST GET customers:listAccessibleCustomers (v19, no login-customer-id)...');
      const accessToken = await this.getAccessToken(refreshToken);
      
      const headers: any = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      };
      // ❌ DO NOT add login-customer-id — it scopes the response

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
   * Returns all selectable accounts: both Manager (MCC) accounts and their child accounts
   */
  async getAllSelectableAccounts(refreshToken: string): Promise<any[]> {
    try {
      const accessibleCustomers = await this.listAccessibleCustomers(refreshToken);
      this.logger.log(`[GET-ALL-ACCOUNTS] Processing ${accessibleCustomers.length} accessible customers: ${JSON.stringify(accessibleCustomers)}`);
      const allAccounts: any[] = [];

      for (const resourceName of accessibleCustomers) {
        const customerId = resourceName.replace('customers/', '');

        try {
          const selfQuery = `SELECT customer.id, customer.descriptive_name, customer.manager, customer.status FROM customer LIMIT 1`;
          // For selfQuery, use the customer's own ID as loginCustomerId (required for MCC accounts)
          const selfResult = await this.rawRestQuery(customerId, refreshToken, selfQuery, customerId);

          if (selfResult.length > 0) {
            const info = selfResult[0].customer;
            const isManager = info.manager || false;
            const accountName = info.descriptiveName || info.descriptive_name || `Account ${customerId}`;
            const accountStatus = info.status || 'ENABLED';

            this.logger.log(`[GET-ALL-ACCOUNTS] Customer ${customerId} | name=${accountName} | isManager=${isManager}`);

            if (isManager) {
              // Add the Manager (MCC) account itself as selectable
              if (!allAccounts.find(a => a.id === customerId)) {
                allAccounts.push({
                  id: customerId,
                  name: `${accountName} (Manager)`,
                  type: 'MANAGER',
                  status: accountStatus,
                });
              }

              // Also fetch and add all child (non-manager) accounts under this MCC
              try {
                const childQuery = `SELECT customer_client.id, customer_client.descriptive_name, customer_client.status, customer_client.manager FROM customer_client WHERE customer_client.manager = FALSE AND customer_client.status != 'CANCELLED'`;
                // ⚠️ Must use MCC id as loginCustomerId to query its children
                const children = await this.rawRestQuery(customerId, refreshToken, childQuery, customerId);
                this.logger.log(`[GET-ALL-ACCOUNTS] MCC ${customerId} has ${children.length} child accounts`);

                for (const row of children) {
                  const client = row.customerClient || row.customer_client;
                  if (!client) continue;
                  const childId = client.id?.toString();
                  if (!childId) continue;
                  if (!allAccounts.find(a => a.id === childId)) {
                    allAccounts.push({
                      id: childId,
                      name: client.descriptiveName || client.descriptive_name || `Account ${childId}`,
                      type: 'ACCOUNT',
                      parentMccId: customerId,
                      parentMccName: accountName,
                      status: client.status || 'ENABLED',
                    });
                  }
                }
              } catch (childErr: any) {
                this.logger.warn(`[GET-ALL-ACCOUNTS] Failed to fetch children for MCC ${customerId}: ${childErr.message}`);
              }
            } else {
              // Regular (non-manager) account — add it directly
              if (!allAccounts.find(a => a.id === customerId)) {
                allAccounts.push({
                  id: customerId,
                  name: accountName,
                  type: 'ACCOUNT',
                  status: accountStatus,
                });
              }
            }
          } else {
            // Could not query account info — add as unknown but still selectable
            if (!allAccounts.find(a => a.id === customerId)) {
              this.logger.warn(`[GET-ALL-ACCOUNTS] No info returned for ${customerId}, adding as unknown`);
              allAccounts.push({
                id: customerId,
                name: `Account ${customerId}`,
                type: 'ACCOUNT',
                status: 'UNKNOWN',
              });
            }
          }
        } catch (e: any) {
          this.logger.warn(`[GET-ALL-ACCOUNTS] Failed to process ${customerId}: ${e.message}`);
          // Still add a basic entry so user can attempt to connect
          if (!allAccounts.find(a => a.id === customerId)) {
            allAccounts.push({
              id: customerId,
              name: `Account ${customerId} (Unverified)`,
              type: 'ACCOUNT',
              status: 'UNKNOWN',
            });
          }
        }
      }

      this.logger.log(`[GET-ALL-ACCOUNTS] Total selectable accounts: ${allAccounts.length} → ${JSON.stringify(allAccounts.map(a => a.id))}`);
      return allAccounts;
    } catch (error: any) {
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
