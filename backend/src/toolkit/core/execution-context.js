"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionContextFactory = void 0;
const crypto_1 = require("crypto");
const contracts_1 = require("./contracts");
class ExecutionContextFactory {
    static create(params) {
        const tenantId = typeof params.tenantId === 'string'
            ? (0, contracts_1.createTenantId)(params.tenantId)
            : params.tenantId;
        return new ExecutionContextImpl({
            tenantId,
            correlationId: (0, crypto_1.randomUUID)(),
            startedAt: new Date(),
            dryRun: params.dryRun ?? false,
            verbose: params.verbose ?? false,
            runId: params.runId,
            logger: params.logger,
            printer: params.printer,
        });
    }
}
exports.ExecutionContextFactory = ExecutionContextFactory;
class ExecutionContextImpl {
    constructor(props) {
        this.tenantId = props.tenantId;
        this.correlationId = props.correlationId;
        this.startedAt = props.startedAt;
        this.dryRun = props.dryRun;
        this.verbose = props.verbose;
        this.runId = props.runId;
        this.logger = props.logger;
        this.printer = props.printer;
        Object.freeze(this);
    }
    with(props) {
        return new ExecutionContextImpl({
            tenantId: props.tenantId ?? this.tenantId,
            correlationId: props.correlationId ?? this.correlationId,
            startedAt: props.startedAt ?? this.startedAt,
            dryRun: props.dryRun ?? this.dryRun,
            verbose: props.verbose ?? this.verbose,
            runId: props.runId ?? this.runId,
            logger: props.logger ?? this.logger,
            printer: props.printer ?? this.printer,
        });
    }
    elapsedMs() {
        return Date.now() - this.startedAt.getTime();
    }
}
//# sourceMappingURL=execution-context.js.map