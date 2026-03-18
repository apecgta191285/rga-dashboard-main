"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var IntegrationErrorHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationErrorHandler = void 0;
const common_1 = require("@nestjs/common");
let IntegrationErrorHandler = IntegrationErrorHandler_1 = class IntegrationErrorHandler {
    constructor() {
        this.logger = new common_1.Logger(IntegrationErrorHandler_1.name);
    }
    async handle(operation, fallbackValue, context) {
        try {
            return await operation();
        }
        catch (error) {
            this.handleError(error, context);
            return fallbackValue;
        }
    }
    handleError(error, context) {
        const isTokenExpired = this.isTokenExpired(error);
        const isNetworkError = this.isNetworkError(error);
        if (isTokenExpired) {
            this.logger.warn(`[${context}] Token Expired: ${error.message}`);
        }
        else if (isNetworkError) {
            this.logger.warn(`[${context}] Network Error: ${error.message}`);
        }
        else {
            this.logger.error(`[${context}] Unexpected Error: ${error.message}`, error.stack);
        }
    }
    isTokenExpired(error) {
        const msg = error.message?.toLowerCase() || '';
        return (msg.includes('token expired') ||
            msg.includes('unauthorized') ||
            msg.includes('invalid_grant') ||
            (error.response?.status === 401));
    }
    isNetworkError(error) {
        const msg = error.message?.toLowerCase() || '';
        return (msg.includes('econnrefused') ||
            msg.includes('timeout') ||
            msg.includes('network error'));
    }
};
exports.IntegrationErrorHandler = IntegrationErrorHandler;
exports.IntegrationErrorHandler = IntegrationErrorHandler = IntegrationErrorHandler_1 = __decorate([
    (0, common_1.Injectable)()
], IntegrationErrorHandler);
//# sourceMappingURL=integration-error.handler.js.map