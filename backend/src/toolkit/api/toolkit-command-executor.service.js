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
exports.ToolkitCommandExecutorService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const command_registry_1 = require("../core/command-registry");
const contracts_1 = require("../core/contracts");
const execution_context_1 = require("../core/execution-context");
const safety_execution_1 = require("../core/safety-execution");
const tenant_reset_service_1 = require("../services/tenant-reset.service");
const prisma_service_1 = require("../../modules/prisma/prisma.service");
const toolkit_internal_tokens_1 = require("./toolkit-internal.tokens");
let ToolkitCommandExecutorService = class ToolkitCommandExecutorService {
    constructor(commandRegistry, config, logger, printer, resetService, prisma) {
        this.commandRegistry = commandRegistry;
        this.config = config;
        this.logger = logger;
        this.printer = printer;
        this.resetService = resetService;
        this.prisma = prisma;
        this.inFlightCommands = 0;
        this.maxConcurrentCommands = this.resolveMaxConcurrentCommands(this.config.features.maxConcurrentCommands);
    }
    issueHardResetToken(tenantId) {
        return this.resetService.generateConfirmationToken(tenantId);
    }
    async executeCommand(command, params) {
        if (!this.tryAcquireExecutionSlot()) {
            this.logger.warn('Toolkit command rejected due to concurrency limit', {
                limit: this.maxConcurrentCommands,
                inFlight: this.inFlightCommands,
                commandName: command.name,
            });
            return contracts_1.Result.failure(new ToolkitConcurrencyLimitError(`Maximum concurrent toolkit commands reached (${this.maxConcurrentCommands}). Retry later.`));
        }
        try {
            const handler = this.commandRegistry.resolve(command.name);
            if (!handler) {
                throw new Error(`Handler not found for command: ${command.name}`);
            }
            const context = execution_context_1.ExecutionContextFactory.create({
                tenantId: params.tenantId,
                logger: this.logger,
                printer: this.printer,
                runId: (0, crypto_1.randomUUID)(),
                dryRun: params.dryRun,
                verbose: true,
            });
            const { result } = await (0, safety_execution_1.executeWithSafetyManifest)({
                commandName: command.name,
                executionMode: 'INTERNAL_API',
                context,
                prisma: this.prisma,
                args: {
                    dryRun: params.dryRun,
                },
                execute: async () => (handler.execute(command, context)),
            });
            return result;
        }
        finally {
            this.releaseExecutionSlot();
        }
    }
    resolveMaxConcurrentCommands(configuredLimit) {
        if (!Number.isFinite(configuredLimit) || configuredLimit <= 0) {
            return 5;
        }
        return configuredLimit;
    }
    tryAcquireExecutionSlot() {
        if (this.inFlightCommands >= this.maxConcurrentCommands) {
            return false;
        }
        this.inFlightCommands += 1;
        return true;
    }
    releaseExecutionSlot() {
        this.inFlightCommands = Math.max(0, this.inFlightCommands - 1);
    }
};
exports.ToolkitCommandExecutorService = ToolkitCommandExecutorService;
exports.ToolkitCommandExecutorService = ToolkitCommandExecutorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(toolkit_internal_tokens_1.TOOLKIT_INTERNAL_COMMAND_REGISTRY)),
    __param(1, (0, common_1.Inject)(toolkit_internal_tokens_1.TOOLKIT_INTERNAL_CONFIG)),
    __param(2, (0, common_1.Inject)(toolkit_internal_tokens_1.TOOLKIT_INTERNAL_LOGGER)),
    __param(3, (0, common_1.Inject)(toolkit_internal_tokens_1.TOOLKIT_INTERNAL_UI_PRINTER)),
    __metadata("design:paramtypes", [command_registry_1.CommandRegistry, Object, Object, Object, tenant_reset_service_1.TenantResetService,
        prisma_service_1.PrismaService])
], ToolkitCommandExecutorService);
class ToolkitConcurrencyLimitError extends contracts_1.ToolkitError {
    constructor(message) {
        super(message);
        this.code = 'CONCURRENCY_LIMIT';
        this.isRecoverable = true;
    }
}
//# sourceMappingURL=toolkit-command-executor.service.js.map