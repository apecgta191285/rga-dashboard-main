"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GoogleAdsClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsClientService = void 0;
const common_1 = require("@nestjs/common");
const google_ads_api_1 = require("google-ads-api");
const config_1 = require("@nestjs/config");
let GoogleAdsClientService = GoogleAdsClientService_1 = class GoogleAdsClientService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(GoogleAdsClientService_1.name);
        this.client = new google_ads_api_1.GoogleAdsApi({
            client_id: this.configService.get('GOOGLE_CLIENT_ID'),
            client_secret: this.configService.get('GOOGLE_CLIENT_SECRET'),
            developer_token: this.configService.get('GOOGLE_ADS_DEVELOPER_TOKEN'),
        });
    }
    getCustomer(customerId, refreshToken, loginCustomerId) {
        return this.client.Customer({
            customer_id: customerId,
            refresh_token: refreshToken,
            login_customer_id: loginCustomerId || undefined,
        });
    }
    async listAccessibleCustomers(refreshToken) {
        const result = await this.client.listAccessibleCustomers(refreshToken);
        if (result && result.resource_names) {
            return result.resource_names;
        }
        if (Array.isArray(result)) {
            return result;
        }
        return [];
    }
    async getClientAccounts(refreshToken, loginCustomerId) {
        if (!loginCustomerId) {
            throw new Error('loginCustomerId is required to get client accounts');
        }
        this.logger.log(`Using Manager Account ID: ${loginCustomerId} to list client accounts`);
        const customer = this.client.Customer({
            customer_id: loginCustomerId,
            refresh_token: refreshToken,
            login_customer_id: loginCustomerId,
        });
        const query = `
      SELECT
        customer_client.id,
        customer_client.descriptive_name,
        customer_client.manager,
        customer_client.status
      FROM customer_client
      WHERE customer_client.manager = FALSE
    `;
        try {
            const results = await customer.query(query);
            this.logger.log(`Found ${results.length} client accounts`);
            const statusMap = {
                0: 'UNSPECIFIED',
                1: 'UNKNOWN',
                2: 'ENABLED',
                3: 'CANCELED',
                4: 'SUSPENDED',
                5: 'CLOSED',
            };
            return results.map((row) => ({
                id: row.customer_client.id.toString(),
                name: row.customer_client.descriptive_name || `Account ${row.customer_client.id}`,
                isManager: row.customer_client.manager || false,
                status: statusMap[row.customer_client.status] || 'UNKNOWN',
            }));
        }
        catch (error) {
            this.logger.error(`Failed to get client accounts: ${error.message}`);
            throw new Error(`Failed to get client accounts: ${error.message}`);
        }
    }
    async getAllSelectableAccounts(refreshToken) {
        const accessibleCustomers = await this.listAccessibleCustomers(refreshToken);
        this.logger.log(`Found ${accessibleCustomers.length} accessible customers: ${accessibleCustomers.join(', ')}`);
        const allAccounts = [];
        const statusMap = {
            0: 'UNSPECIFIED',
            1: 'UNKNOWN',
            2: 'ENABLED',
            3: 'CANCELED',
            4: 'SUSPENDED',
            5: 'CLOSED',
        };
        for (const resourceName of accessibleCustomers) {
            const customerId = resourceName.replace('customers/', '');
            try {
                const customer = this.client.Customer({
                    customer_id: customerId,
                    refresh_token: refreshToken,
                    login_customer_id: customerId,
                });
                const selfQuery = `
          SELECT
            customer.id,
            customer.descriptive_name,
            customer.manager,
            customer.status
          FROM customer
          LIMIT 1
        `;
                let accountInfo = null;
                try {
                    const selfResult = await customer.query(selfQuery);
                    if (selfResult.length > 0) {
                        accountInfo = selfResult[0].customer;
                    }
                }
                catch (e) {
                    this.logger.warn(`Could not get self info for ${customerId}: ${e.message}`);
                }
                const isManager = accountInfo?.manager || false;
                const accountName = accountInfo?.descriptive_name || `Account ${customerId}`;
                const accountStatus = statusMap[accountInfo?.status] || 'UNKNOWN';
                if (isManager) {
                    this.logger.debug(`${customerId} is MCC, fetching child accounts...`);
                    const childQuery = `
            SELECT
              customer_client.id,
              customer_client.descriptive_name,
              customer_client.manager,
              customer_client.status
            FROM customer_client
            WHERE customer_client.manager = FALSE
          `;
                    try {
                        const childResults = await customer.query(childQuery);
                        this.logger.log(`Found ${childResults.length} child accounts under MCC ${customerId}`);
                        for (const row of childResults) {
                            const childId = row.customer_client.id.toString();
                            if (!allAccounts.find(a => a.id === childId)) {
                                allAccounts.push({
                                    id: childId,
                                    name: row.customer_client.descriptive_name || `Account ${childId}`,
                                    type: 'ACCOUNT',
                                    parentMccId: customerId,
                                    parentMccName: accountName,
                                    status: statusMap[row.customer_client.status] || 'UNKNOWN',
                                });
                            }
                        }
                    }
                    catch (childError) {
                        this.logger.warn(`Could not fetch children for MCC ${customerId}: ${childError.message}`);
                    }
                }
                else {
                    this.logger.debug(`${customerId} is Direct Account, adding directly`);
                    if (!allAccounts.find(a => a.id === customerId)) {
                        allAccounts.push({
                            id: customerId,
                            name: accountName,
                            type: 'ACCOUNT',
                            status: accountStatus,
                        });
                    }
                }
            }
            catch (error) {
                this.logger.error(`Error processing accessible customer ${customerId}: ${error.message}`);
            }
        }
        this.logger.log(`Total selectable accounts after flatten: ${allAccounts.length}`);
        return allAccounts;
    }
};
exports.GoogleAdsClientService = GoogleAdsClientService;
exports.GoogleAdsClientService = GoogleAdsClientService = GoogleAdsClientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleAdsClientService);
//# sourceMappingURL=google-ads-client.service.js.map