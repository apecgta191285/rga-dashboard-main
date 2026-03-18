"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const toolkit_command_executor_service_1 = require("../../api/toolkit-command-executor.service");
const command_registry_1 = require("../../core/command-registry");
const contracts_1 = require("../../core/contracts");
class DelayCommand {
    constructor() {
        this.name = (0, contracts_1.createCommandName)('delay-cmd');
        this.description = 'Delay command';
        this.requiresConfirmation = false;
    }
}
class DelayHandler {
    canHandle(command) {
        return command.name === (0, contracts_1.createCommandName)('delay-cmd');
    }
    async execute() {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return contracts_1.Result.success({ ok: true });
    }
    getMetadata() {
        return {
            name: 'delay-cmd',
            displayName: 'Delay',
            description: 'Delay command',
            icon: 'D',
            category: 'testing',
            estimatedDurationSeconds: 1,
            risks: [],
        };
    }
    validate(_command) {
        return contracts_1.Result.success(undefined);
    }
}
const logger = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    child: () => logger,
};
const printer = {
    log: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    header: () => undefined,
    spinner: () => ({
        start: () => undefined,
        succeed: () => undefined,
        fail: () => undefined,
        stop: () => undefined,
    }),
};
(0, node_test_1.describe)('ToolkitCommandExecutorService concurrency limit', () => {
    const config = {
        environment: 'development',
        database: { url: 'postgresql://localhost/db', timeoutMs: 5000, maxRetries: 3 },
        api: { baseUrl: 'http://localhost:3000', timeoutMs: 5000, retryAttempts: 3, retryDelayMs: 1000 },
        logging: { level: 'info', format: 'pretty' },
        features: { enableDryRun: true, confirmDestructiveActions: true, maxConcurrentCommands: 1 },
    };
    (0, node_test_1.it)('rejects a command when in-flight executions reach maxConcurrentCommands', async () => {
        const registry = new command_registry_1.CommandRegistry(logger);
        registry.register(new DelayHandler());
        const service = new toolkit_command_executor_service_1.ToolkitCommandExecutorService(registry, config, logger, printer, { generateConfirmationToken: () => ({ token: 'x', expiresAt: new Date() }) }, {});
        const command = new DelayCommand();
        const firstExecution = service.executeCommand(command, {
            tenantId: 'tenant-1',
            dryRun: true,
        });
        const secondExecution = await service.executeCommand(command, {
            tenantId: 'tenant-1',
            dryRun: true,
        });
        node_assert_1.strict.strictEqual(secondExecution.kind, 'failure');
        if (secondExecution.kind === 'failure') {
            node_assert_1.strict.strictEqual(secondExecution.error.code, 'CONCURRENCY_LIMIT');
            node_assert_1.strict.strictEqual(secondExecution.error.isRecoverable, true);
        }
        const firstResult = await firstExecution;
        node_assert_1.strict.strictEqual(firstResult.kind, 'success');
    });
});
//# sourceMappingURL=toolkit-command-executor.concurrency.test.js.map