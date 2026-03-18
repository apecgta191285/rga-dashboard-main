"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolkitInternalGuard = void 0;
const common_1 = require("@nestjs/common");
let ToolkitInternalGuard = class ToolkitInternalGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (process.env.NODE_ENV === 'production') {
            throw new common_1.ForbiddenException('Toolkit internal API is disabled in production');
        }
        if (process.env.TOOLKIT_INTERNAL_API_ENABLED !== 'true') {
            throw new common_1.ForbiddenException('Toolkit internal API is disabled');
        }
        const expectedKey = process.env.TOOLKIT_INTERNAL_API_KEY;
        if (!expectedKey) {
            throw new common_1.ForbiddenException('TOOLKIT_INTERNAL_API_KEY is not configured');
        }
        const headerValue = request.headers?.['x-toolkit-internal-key'];
        const providedKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;
        if (!providedKey || providedKey !== expectedKey) {
            throw new common_1.UnauthorizedException('Invalid toolkit internal API key');
        }
        return true;
    }
};
exports.ToolkitInternalGuard = ToolkitInternalGuard;
exports.ToolkitInternalGuard = ToolkitInternalGuard = __decorate([
    (0, common_1.Injectable)()
], ToolkitInternalGuard);
//# sourceMappingURL=toolkit-internal.guard.js.map