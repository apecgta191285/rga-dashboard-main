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
   * 🚀 RAW REST QUERY: Execute a Google Ads Search query via Axios (Bypass gRPC)
   * This is the ONLY reliable way to work on Hostinger.
   */
  async rawRestQuery(customerId: string, refreshToken: string, query: string, loginCustomerId?: string | null) {
    const cleanId = customerId.replace(/-/g, '');
    const cleanLoginId = loginCustomerId ? loginCustomerId.replace(/-/g, '') : undefined;
    const finalLoginId = (cleanLoginId && cleanLoginId !== cleanId) ? cleanLoginId : undefined;

    const accessToken = await this.getAccessToken(refreshToken);
    const developerToken = this.configService.get('GOOGLE_ADS_DEVELOPER_TOKEN');

    // Use v23 REST API
    const url = `https://googleads.googleapis.com/v23/customers/${cleanId}/googleAds:search`;

    this.logger.debug(`[RAW-REST] Executing query for ${cleanId} (LoginId: ${finalLoginId || 'DIRECT'})`);

    const headers: any = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    };

    if (finalLoginId) {
      headers['login-customer-id'] = finalLoginId;
    }

    const response = await axios.post(url, { query }, { headers });
    
    // Normalize format to match library output (results array)
    return response.data?.results || [];
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
      const url = 'https://googleads.googleapis.com/v23/customers:listAccessibleCustomers';
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': this.configService.get('GOOGLE_ADS_DEVELOPER_TOKEN'),
        }
      });
      return response.data?.resourceNames || [];
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
    const accessibleCustomers = await this.listAccessibleCustomers(refreshToken);
    const allAccounts: any[] = [];

    for (const resourceName of accessibleCustomers) {
      const customerId = resourceName.replace('customers/', '');

      try {
        // Query info about this account
        const selfQuery = `SELECT customer.id, customer.descriptive_name, customer.manager, customer.status FROM customer LIMIT 1`;
        const selfResult = await this.rawRestQuery(customerId, refreshToken, selfQuery, customerId);

        if (selfResult.length > 0) {
          const info = selfResult[0].customer;
          const isManager = info.manager || false;

          if (isManager) {
            // Fetch children
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
        }
      } catch (e) {
        this.logger.warn(`Failed to scan hierarchy for ${customerId}: ${e.message}`);
      }
    }
    return allAccounts;
  }
}
