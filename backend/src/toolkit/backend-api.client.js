"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendApiClient = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEFAULT_TIMEOUT_MS = 30000;
class BackendApiClient {
    constructor(baseUrl, timeoutMs) {
        this.baseUrl = baseUrl || process.env.API_BASE_URL || DEFAULT_API_BASE_URL;
        this.timeoutMs = timeoutMs || DEFAULT_TIMEOUT_MS;
    }
    async triggerAlertCheck(token, tenantId, timeframe = 'YESTERDAY') {
        const url = `${this.baseUrl}/api/v1/alerts/trigger-check`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-id': tenantId,
                },
                body: JSON.stringify({ timeframe }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || response.statusText;
                }
                catch {
                    errorMessage = errorText || response.statusText;
                }
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorMessage}`);
            }
            const data = (await response.json());
            return data;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error(`Request timeout after ${this.timeoutMs}ms`);
                }
                throw error;
            }
            throw new Error(`Unknown error: ${String(error)}`);
        }
    }
    async healthCheck() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    getBaseUrl() {
        return this.baseUrl;
    }
}
exports.BackendApiClient = BackendApiClient;
//# sourceMappingURL=backend-api.client.js.map