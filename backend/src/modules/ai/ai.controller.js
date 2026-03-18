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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const ai_service_1 = require("./ai.service");
const create_user_behavior_dto_1 = require("./dto/create-user-behavior.dto");
const create_ai_recommendation_dto_1 = require("./dto/create-ai-recommendation.dto");
const list_user_behavior_query_1 = require("./dto/list-user-behavior.query");
const list_ai_recommendations_query_1 = require("./dto/list-ai-recommendations.query");
let AiController = class AiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async createBehavior(dto, req) {
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        return this.aiService.createUserBehavior(tenantId, userId, dto);
    }
    async listBehavior(query, req) {
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        return this.aiService.listUserBehavior(tenantId, userId, query);
    }
    async createRecommendation(dto, req) {
        const tenantId = req.user.tenantId;
        return this.aiService.createAiRecommendation(tenantId, dto);
    }
    async listRecommendations(query, req) {
        const tenantId = req.user.tenantId;
        return this.aiService.listAiRecommendations(tenantId, query);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('behavior'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_behavior_dto_1.CreateUserBehaviorDto, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "createBehavior", null);
__decorate([
    (0, common_1.Get)('behavior'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_user_behavior_query_1.ListUserBehaviorQuery, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "listBehavior", null);
__decorate([
    (0, common_1.Post)('recommendations'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_ai_recommendation_dto_1.CreateAiRecommendationDto, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "createRecommendation", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_ai_recommendations_query_1.ListAiRecommendationsQuery, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "listRecommendations", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map