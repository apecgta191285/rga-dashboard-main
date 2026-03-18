"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantCacheInterceptor = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
let TenantCacheInterceptor = class TenantCacheInterceptor extends cache_manager_1.CacheInterceptor {
    trackBy(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const tenantId = user?.tenantId || 'anonymous';
        const url = request?.originalUrl || request?.url || '';
        if (url.includes('/dashboard/overview')) {
            return undefined;
        }
        const originalKey = super.trackBy(context);
        if (!originalKey) {
            return undefined;
        }
        return `tenant-${tenantId}-${originalKey}`;
    }
};
exports.TenantCacheInterceptor = TenantCacheInterceptor;
exports.TenantCacheInterceptor = TenantCacheInterceptor = __decorate([
    (0, common_1.Injectable)()
], TenantCacheInterceptor);
//# sourceMappingURL=tenant-cache.interceptor.js.map