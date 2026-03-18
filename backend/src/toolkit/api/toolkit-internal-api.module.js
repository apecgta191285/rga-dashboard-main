"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolkitInternalApiModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../modules/prisma/prisma.module");
const toolkit_controller_1 = require("./toolkit.controller");
const toolkit_command_executor_service_1 = require("./toolkit-command-executor.service");
const toolkit_internal_guard_1 = require("./toolkit-internal.guard");
const toolkit_internal_providers_1 = require("./toolkit-internal.providers");
const toolkit_query_service_1 = require("./toolkit-query.service");
let ToolkitInternalApiModule = class ToolkitInternalApiModule {
};
exports.ToolkitInternalApiModule = ToolkitInternalApiModule;
exports.ToolkitInternalApiModule = ToolkitInternalApiModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [toolkit_controller_1.ToolkitController],
        providers: [
            toolkit_internal_guard_1.ToolkitInternalGuard,
            toolkit_query_service_1.ToolkitQueryService,
            toolkit_command_executor_service_1.ToolkitCommandExecutorService,
            ...toolkit_internal_providers_1.TOOLKIT_INTERNAL_PROVIDERS,
        ],
    })
], ToolkitInternalApiModule);
//# sourceMappingURL=toolkit-internal-api.module.js.map