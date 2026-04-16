import { Injectable, Logger } from '@nestjs/common';
// import { GoogleAdsApi } from 'google-ads-api';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { google } from 'googleapis';

@Injectable()
export class GoogleAdsClientService {
  private readonly logger = new Logger(GoogleAdsClientService.name);
  // private client: GoogleAdsApi;

  constructor(private configService: ConfigService) {
    this.logger.warn('🚀 [DIAGNOSTIC] ANTIGRAVITY VERSION 2 LOADED (GRPC DISABLED)');
    /*
    this.client = new GoogleAdsApi({
      client_id: this.configService.get('GOOGLE_CLIENT_ID'),
      client_secret: this.configService.get('GOOGLE_CLIENT_SECRET'),
      developer_token: this.configService.get('GOOGLE_ADS_DEVELOPER_TOKEN'),
      // Keep for legacy, but we will mostly use rawRestQuery now
      // @ts-ignore
      transport: 'rest',
    });
    */
  }

  /**
   * 🔑 REST AUTH: Get a fresh Access Token for raw REST calls
   */
  async getAccessToken(refreshToken: string): Promise<string> {
    const clientId = this.configService.get('GOOGLE_ADS_CLIENT_ID') || this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_ADS_CLIENT_SECRET') || this.configService.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Missing Google OAuth client credentials for Ads');
    }

    this.logger.debug(`[TOKEN] getAccessToken: clientId=${clientId?.substring(0, 20)}...`);
    this.logger.debug(`[TOKEN] getAccessToken: refreshToken=${refreshToken?.substring(0, 20)}...`);

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    try {
      this.logger.debug(`[TOKEN] Calling oauth2Client.getAccessToken()...`);
      const { token } = await oauth2Client.getAccessToken();
      
      if (!token) {
        this.logger.error(`[TOKEN] ❌ Failed to obtain access token - token is null/undefined`);
        throw new Error('Failed to obtain access token from Google - token is null. Your refresh token may be invalid or expired. Please reconnect your Google Ads account.');
      }
      
      this.logger.debug(`[TOKEN] ✅ Got access token: ${token.substring(0, 20)}...`);
      return token;
    } catch (error: any) {
      this.logger.error(`[TOKEN] ❌ Token refresh failed`);
      this.logger.error(`[TOKEN] Error message: ${error.message}`);
      this.logger.error(`[TOKEN] Error: ${JSON.stringify(error)}`);
      
      // Provide more helpful error message
      if (error.message?.includes('invalid_grant')) {
        throw new Error('Your Google Ads connection has expired. Please reconnect your Google Ads account.');
      } else if (error.message?.includes('unauthorized_client')) {
        throw new Error('OAuth client credentials mismatch. Please check your Google Cloud project settings and reconnect.');
      }
      
      throw new Error(`Failed to refresh Google OAuth token: ${error.message}. Please reconnect your Google Ads account.`);
    }
  }

  /**
   * 🚀 RAW REST QUERY: Execute a Google Ads Search query via Axios (Bypass gRPC)
   * This is the ONLY reliable way to work on Hostinger.
   */
  async rawRestQuery(customerId: string, refreshToken: string, query: string, loginCustomerId?: string | null) {
    const cleanId = customerId.replace(/-/g, '');
    const configuredLoginCustomerId = this.configService.get<string>('GOOGLE_ADS_LOGIN_CUSTOMER_ID');
    
    // Skip using the configured LOGIN_CUSTOMER_ID if it's the placeholder value
    const isPlaceholder = configuredLoginCustomerId === 'YOUR_GOOGLE_ADS_LOGIN_CUSTOMER_ID' || !configuredLoginCustomerId;
    const loginIdCandidate = loginCustomerId || (!isPlaceholder ? configuredLoginCustomerId : null);
    const cleanLoginId = loginIdCandidate ? loginIdCandidate.replace(/-/g, '') : undefined;
    const finalLoginId = (cleanLoginId && cleanLoginId !== cleanId) ? cleanLoginId : undefined;

    const accessToken = await this.getAccessToken(refreshToken);
    const developerToken = this.configService.get('GOOGLE_ADS_DEVELOPER_TOKEN');

    if (!developerToken) {
      throw new Error('Missing Google Ads developer token');
    }

    // Use v23 REST API
    const url = `https://googleads.googleapis.com/v23/customers/${cleanId}/googleAds:search`;

    this.logger.debug(`[RAW-REST] Executing query for ${cleanId} (LoginId: ${finalLoginId || 'DIRECT'})`);
    this.logger.debug(`[RAW-REST] URL: ${url}`);
    this.logger.debug(`[RAW-REST] Has dev token: ${!!developerToken}`);

    const headers: any = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    };

    if (finalLoginId) {
      headers['login-customer-id'] = finalLoginId;
      this.logger.debug(`[RAW-REST] Added login-customer-id: ${finalLoginId}`);
    }

    try {
      this.logger.debug(`[RAW-REST] Making POST request to ${url}`);
      const response = await axios.post(url, { query }, { headers });
      this.logger.debug(`[RAW-REST] ✅ Success! Got ${response.data?.results?.length || 0} results`);
      this.logger.debug(`[RAW-REST] Full response data: ${JSON.stringify(response.data, null, 2)}`);
      
      // Normalize format to match library output (results array)
      return response.data?.results || [];
    } catch (error: any) {
      this.logger.error(`[RAW-REST] ❌ Request failed`);
      this.logger.error(`[RAW-REST] Status: ${error.response?.status}`);
      this.logger.error(`[RAW-REST] StatusText: ${error.response?.statusText}`);
      this.logger.error(`[RAW-REST] Error data: ${JSON.stringify(error.response?.data)}`);
      this.logger.error(`[RAW-REST] Full error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper to keep the existing interface but we'll migrate calls to rawRestQuery
   */
  getCustomer(customerId: string, refreshToken: string, loginCustomerId?: string | null) {
    /*
    return this.client.Customer({
      customer_id: customerId.replace(/-/g, ''),
      refresh_token: refreshToken,
      login_customer_id: loginCustomerId ? loginCustomerId.replace(/-/g, '') : undefined,
    });
    */
    throw new Error('getCustomer is disabled - migrate to rawRestQuery');
  }

  async listAccessibleCustomers(refreshToken: string): Promise<string[]> {
      const accessToken = await this.getAccessToken(refreshToken);
      const configuredLoginCustomerId = this.configService.get<string>('GOOGLE_ADS_LOGIN_CUSTOMER_ID');
      const isPlaceholder = configuredLoginCustomerId === 'YOUR_GOOGLE_ADS_LOGIN_CUSTOMER_ID' || !configuredLoginCustomerId;
      
      this.logger.debug(`[LIST-ACCESSIBLE] Starting listAccessibleCustomers`);
      this.logger.debug(`[LIST-ACCESSIBLE] configuredLoginCustomerId: ${configuredLoginCustomerId}`);
      this.logger.debug(`[LIST-ACCESSIBLE] isPlaceholder: ${isPlaceholder}`);
      
      const headers: any = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': this.configService.get('GOOGLE_ADS_DEVELOPER_TOKEN'),
      };

      if (configuredLoginCustomerId && !isPlaceholder) {
        headers['login-customer-id'] = configuredLoginCustomerId.replace(/-/g, '');
        this.logger.debug(`[LIST-ACCESSIBLE] Using login-customer-id: ${headers['login-customer-id']}`);
      }

      const url = 'https://googleads.googleapis.com/v23/customers:listAccessibleCustomers';
      
      try {
        this.logger.debug(`[LIST-ACCESSIBLE] Making GET request to ${url}`);
        const response = await axios.get(url, { headers });
        const resourceNames = response.data?.resourceNames || [];
        this.logger.log(`[LIST-ACCESSIBLE] ✅ Got ${resourceNames.length} accessible customers`);
        return resourceNames;
      } catch (error: any) {
        this.logger.error(`[LIST-ACCESSIBLE] ❌ Request failed`);
        this.logger.error(`[LIST-ACCESSIBLE] Status: ${error.response?.status}`);
        this.logger.error(`[LIST-ACCESSIBLE] StatusText: ${error.response?.statusText}`);
        this.logger.error(`[LIST-ACCESSIBLE] Error data: ${JSON.stringify(error.response?.data)}`);
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
      const client = row.customerClient || row.customer_client;
      return {
        id: client.id.toString(),
        name: client.descriptiveName || client.descriptive_name || `Account ${client.id}`,
        status: client.status || 'UNKNOWN',
      };
    });
  }

  /**
   * 🔎 SCAN HIERARCHY: List all accounts and their sub-accounts via REST
   */
  async getAllSelectableAccounts(refreshToken: string): Promise<any[]> {
    this.logger.log(`[GET-ALL-ACCOUNTS] ========== START ==========`);
    try {
      this.logger.log(`[GET-ALL-ACCOUNTS] Calling listAccessibleCustomers...`);
      const accessibleCustomers = await this.listAccessibleCustomers(refreshToken);
      this.logger.log(`[GET-ALL-ACCOUNTS] Got ${accessibleCustomers.length} accessible customers`);
      
      const allAccounts: any[] = [];

      for (const resourceName of accessibleCustomers) {
        const customerId = resourceName.replace('customers/', '');
        this.logger.debug(`[GET-ALL-ACCOUNTS] Processing customer: ${customerId}`);

        try {
          // Query info about this account
          const selfQuery = `SELECT customer.id, customer.descriptive_name, customer.manager, customer.status FROM customer LIMIT 1`;
          const selfResult = await this.rawRestQuery(customerId, refreshToken, selfQuery, customerId);

          if (selfResult.length > 0) {
            const info = selfResult[0].customer;
            const isManager = info.manager || false;
            this.logger.debug(`[GET-ALL-ACCOUNTS] Customer ${customerId} isManager: ${isManager}`);

            if (isManager) {
              // Fetch children
              const childQuery = `SELECT customer_client.id, customer_client.descriptive_name, customer_client.status FROM customer_client WHERE customer_client.manager = FALSE`;
              const children = await this.rawRestQuery(customerId, refreshToken, childQuery, customerId);
              this.logger.debug(`[GET-ALL-ACCOUNTS] Customer ${customerId} has ${children.length} child accounts`);
              
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
          }
        } catch (e) {
          this.logger.warn(`[GET-ALL-ACCOUNTS] Failed to scan hierarchy for ${customerId}: ${e.message}`);
        }
      }
      
      this.logger.log(`[GET-ALL-ACCOUNTS] ========== COMPLETE: Found ${allAccounts.length} total accounts ==========`);
      return allAccounts;
    } catch (error) {
      this.logger.error(`[GET-ALL-ACCOUNTS] ❌ FATAL ERROR: ${error.message}`);
      throw error;
    }
  }

}
