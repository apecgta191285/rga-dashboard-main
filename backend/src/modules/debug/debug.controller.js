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
var DebugController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const debug_service_1 = require("./debug.service");
let DebugController = DebugController_1 = class DebugController {
    constructor(debugService) {
        this.debugService = debugService;
        this.logger = new common_1.Logger(DebugController_1.name);
    }
    async clearMockData() {
        return this.debugService.clearMockData();
    }
};
exports.DebugController = DebugController;
__decorate([
    (0, common_1.Delete)('mock-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Clear all mock data (Admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DebugController.prototype, "clearMockData", null);
exports.DebugController = DebugController = DebugController_1 = __decorate([
    (0, swagger_1.ApiTags)('debug'),
    (0, common_1.Controller)('debug'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [debug_service_1.DebugService])
], DebugController);
//# sourceMappingURL=debug.controller.js.map