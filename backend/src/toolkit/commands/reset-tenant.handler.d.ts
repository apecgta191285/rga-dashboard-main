import { ICommandHandler, IExecutionContext, Result, ILogger } from '../core/contracts';
import { BaseCommandHandler } from './base-command';
import { ResetTenantCommand, ResetTenantHardCommand } from './definitions/reset-tenant.command';
import { TenantResetService, ResetResult } from '../services/tenant-reset.service';
export declare class ResetTenantCommandHandler extends BaseCommandHandler<ResetTenantCommand, ResetResult> implements ICommandHandler<ResetTenantCommand, ResetResult> {
    readonly commandName: import("../core/contracts").CommandName;
    private readonly resetService;
    constructor(logger: ILogger, resetService: TenantResetService);
    canHandle(command: unknown): command is ResetTenantCommand;
    getMetadata(): {
        name: import("../core/contracts").CommandName;
        displayName: string;
        description: string;
        icon: string;
        category: "maintenance";
        estimatedDurationSeconds: number;
        risks: string[];
    };
    validate(command: ResetTenantCommand): Result<void>;
    protected executeCore(command: ResetTenantCommand, context: IExecutionContext): Promise<Result<ResetResult>>;
}
export declare class ResetTenantHardCommandHandler extends BaseCommandHandler<ResetTenantHardCommand, ResetResult> implements ICommandHandler<ResetTenantHardCommand, ResetResult> {
    readonly commandName: import("../core/contracts").CommandName;
    private readonly resetService;
    constructor(logger: ILogger, resetService: TenantResetService);
    canHandle(command: unknown): command is ResetTenantHardCommand;
    getMetadata(): {
        name: import("../core/contracts").CommandName;
        displayName: string;
        description: string;
        icon: string;
        category: "maintenance";
        estimatedDurationSeconds: number;
        risks: string[];
    };
    validate(command: ResetTenantHardCommand): Result<void>;
    protected executeCore(command: ResetTenantHardCommand, context: IExecutionContext): Promise<Result<ResetResult>>;
    generateConfirmationToken(tenantId: string): {
        token: string;
        expiresAt: Date;
    };
}
