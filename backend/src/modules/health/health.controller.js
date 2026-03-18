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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const prisma_health_indicator_1 = require("./prisma-health.indicator");
const app_constants_1 = require("../../common/constants/app.constants");
let HealthController = class HealthController {
    constructor(health, db, memory) {
        this.health = health;
        this.db = db;
        this.memory = memory;
    }
    check() {
        return this.health.check([
            () => this.db.isHealthy('database'),
            () => this.memory.checkHeap('memory_heap', app_constants_1.HEALTH_CHECK.MEMORY_THRESHOLD_BYTES),
        ]);
    }
    liveness() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }
    readiness() {
        return this.health.check([
            () => this.db.isHealthy('database'),
        ]);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('liveness'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "liveness", null);
__decorate([
    (0, common_1.Get)('readiness'),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "readiness", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        prisma_health_indicator_1.PrismaHealthIndicator,
        terminus_1.MemoryHealthIndicator])
], HealthController);
//# sourceMappingURL=health.controller.js.map