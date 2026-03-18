"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCommandHandler = exports.BaseCommand = void 0;
const contracts_1 = require("../core/contracts");
class BaseCommand {
    constructor(requiresConfirmation = false) {
        this.requiresConfirmation = requiresConfirmation;
    }
}
exports.BaseCommand = BaseCommand;
class BaseCommandHandler {
    constructor(deps) {
        this.logger = deps.logger.child({ handler: this.constructor.name });
    }
    async execute(command, context) {
        const startTime = Date.now();
        this.logger.info('Command started', {
            command: command.name,
            tenantId: context.tenantId,
            correlationId: context.correlationId,
            dryRun: context.dryRun,
        });
        try {
            const validation = this.validate(command);
            if (validation.kind === 'failure') {
                this.logger.warn('Command validation failed', {
                    command: command.name,
                    error: validation.error,
                });
                return validation;
            }
            const result = await this.executeCore(command, context);
            const duration = Date.now() - startTime;
            this.logger.info('Command completed', {
                command: command.name,
                durationMs: duration,
                success: result.kind === 'success',
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Command failed unexpectedly', error instanceof Error ? error : undefined, {
                command: command.name,
                durationMs: duration,
            });
            return contracts_1.Result.failure(new CommandExecutionError(errorMessage));
        }
    }
}
exports.BaseCommandHandler = BaseCommandHandler;
class CommandExecutionError extends contracts_1.ToolkitError {
    constructor(message) {
        super(message);
        this.code = 'COMMAND_EXECUTION_FAILED';
        this.isRecoverable = false;
    }
}
//# sourceMappingURL=base-command.js.map