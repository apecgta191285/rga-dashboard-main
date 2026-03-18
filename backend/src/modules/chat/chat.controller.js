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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const create_chat_session_dto_1 = require("./dto/create-chat-session.dto");
const create_chat_message_dto_1 = require("./dto/create-chat-message.dto");
const optional_jwt_auth_guard_1 = require("../auth/guards/optional-jwt-auth.guard");
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async createSession(createSessionDto, req) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id || null;
        if (!tenantId || !userId) {
            return { message: 'Unauthorized' };
        }
        return this.chatService.createSession(tenantId, userId, createSessionDto);
    }
    async getSessions(queryUserId, req) {
        const userId = req.user?.id || queryUserId || null;
        return this.chatService.getSessions(userId);
    }
    async getSession(id) {
        return this.chatService.getSession(id);
    }
    async updateSessionTitle(id, title) {
        return this.chatService.updateSessionTitle(id, title);
    }
    async deleteSession(id) {
        return this.chatService.deleteSession(id);
    }
    async addMessage(createMessageDto, req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return { message: 'Unauthorized' };
        }
        return this.chatService.addMessage(tenantId, createMessageDto.sessionId, createMessageDto);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('sessions'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_chat_session_dto_1.CreateChatSessionDto, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getSession", null);
__decorate([
    (0, common_1.Patch)('sessions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('title')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "updateSessionTitle", null);
__decorate([
    (0, common_1.Delete)('sessions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteSession", null);
__decorate([
    (0, common_1.Post)('messages'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_chat_message_dto_1.CreateChatMessageDto, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addMessage", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map