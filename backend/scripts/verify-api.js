"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function verify() {
    const API_URL = 'http://localhost:3000/api/v1';
    try {
        const login = await axios_1.default.post(`${API_URL}/auth/login`, {
            email: 'demo@example.com',
            password: 'password123'
        });
        const token = login.data.accessToken;
        const tenantId = login.data.user.tenant.id;
        const overview = await axios_1.default.get(`${API_URL}/dashboard/overview`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { period: '30d' }
        });
        const summary = overview.data.data.summary;
        console.log('--- DATA_VERIFIED_START ---');
        console.log('Impressions:', summary.totalImpressions);
        console.log('Clicks:', summary.totalClicks);
        console.log('Campaigns:', overview.data.data.recentCampaigns.length);
        console.log('--- DATA_VERIFIED_END ---');
    }
    catch (e) {
        console.log('FAILED:', e.response?.data || e.message);
    }
}
verify();
//# sourceMappingURL=verify-api.js.map