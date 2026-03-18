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
exports.ResetTenantHardCommandHandler = exports.ResetTenantCommandHandler = void 0;
const tsyringe_1 = require("tsyringe");
const base_command_1 = require("./base-command");
const reset_tenant_command_1 = require("./definitions/reset-tenant.command");
const tenant_reset_service_1 = require("../services/tenant-reset.service");
const container_1 = require("../core/container");
let ResetTenantCommandHandler = class ResetTenantCommandHandler extends base_command_1.BaseCommandHandler {
    constructor(logger, resetService) {
        super({ logger });
        this.commandName = reset_tenant_command_1.RESET_TENANT_COMMAND;
        this.resetService = resetService;
    }
    canHandle(command) {
        return (typeof command === 'object' &&
            command !== null &&
            'name' in command &&
            command.name === reset_tenant_command_1.RESET_TENANT_COMMAND);
    }
    getMetadata() {
        return {
            name: reset_tenant_command_1.RESET_TENANT_COMMAND,
            displayName: 'Reset Tenant (Partial)',
            description: 'Remove operational data while preserving campaigns and alert definitions',
            icon: '🧹',
            category: 'maintenance',
            estimatedDurationSeconds: 10,
            risks: [
                'Deletes all metrics and historical data',
                'Deletes triggered alerts and their history',
                'Preserves campaigns and alert rule definitions',
            ],
        };
    }
    validate(command) {
        if (!command.tenantId || typeof command.tenantId !== 'string') {
            return {
                kind: 'failure',
                error: {
                    name: 'ValidationError',
                    code: 'VALIDATION_ERROR',
                    message: 'tenantId is required and must be a string',
                    isRecoverable: true,
                },
            };
        }
        return { kind: 'success', value: undefined };
    }
    async executeCore(command, context) {
        this.logger.info('Starting partial tenant reset', {
            tenantId: command.tenantId,
            dryRun: context.dryRun,
        });
        if (context.dryRun) {
            this.logger.info('Dry run mode - no data will be deleted');
            return {
                kind: 'success',
                value: {
                    success: true,
                    mode: 'PARTIAL',
                    message: 'Dry run completed - no data was modified',
                    data: {
                        tenantId: command.tenantId,
                        deletedMetrics: 0,
                        deletedAlerts: 0,
                        durationMs: 0,
                    },
                },
            };
        }
        const result = await this.resetService.partialReset(command.tenantId);
        if (result.success) {
            this.logger.info('Partial reset completed', {
                tenantId: command.tenantId,
                deletedMetrics: result.data?.deletedMetrics ?? 0,
                deletedAlerts: result.data?.deletedAlerts ?? 0,
                durationMs: result.data?.durationMs ?? 0,
            });
            return { kind: 'success', value: result };
        }
        else {
            const error = new Error(result.message);
            this.logger.error('Partial reset failed', error, {
                tenantId: command.tenantId,
                detail: result.error,
            });
            return {
                kind: 'failure',
                error: {
                    name: 'ResetError',
                    code: 'RESET_FAILED',
                    message: result.message,
                    isRecoverable: true,
                },
            };
        }
    }
};
exports.ResetTenantCommandHandler = ResetTenantCommandHandler;
exports.ResetTenantCommandHandler = ResetTenantCommandHandler = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(container_1.TOKENS.Logger)),
    __param(1, (0, tsyringe_1.inject)(tenant_reset_service_1.TenantResetService)),
    __metadata("design:paramtypes", [Object, tenant_reset_service_1.TenantResetService])
], ResetTenantCommandHandler);
let ResetTenantHardCommandHandler = class ResetTenantHardCommandHandler extends base_command_1.BaseCommandHandler {
    constructor(logger, resetService) {
        super({ logger });
        this.commandName = reset_tenant_command_1.RESET_TENANT_HARD_COMMAND;
        this.resetService = resetService;
    }
    canHandle(command) {
        return (typeof command === 'object' &&
            command !== null &&
            'name' in command &&
            command.name === reset_tenant_command_1.RESET_TENANT_HARD_COMMAND);
    }
    getMetadata() {
        return {
            name: reset_tenant_command_1.RESET_TENANT_HARD_COMMAND,
            displayName: 'Reset Tenant (HARD)',
            description: 'DELETE ALL DATA including campaigns and alert definitions - DESTRUCTIVE',
            icon: '☠️',
            category: 'maintenance',
            estimatedDurationSeconds: 15,
            risks: [
                'DELETES ALL METRICS - historical data lost',
                'DELETES ALL CAMPAIGNS - campaign definitions lost',
                'DELETES ALL ALERT RULES - must recreate from scratch',
                'DELETES ALL ALERT HISTORY',
                'TENANT IDENTITY AND USERS PRESERVED',
                'THIS ACTION CANNOT BE UNDONE',
            ],
        };
    }
    validate(command) {
        if (!command.tenantId || typeof command.tenantId !== 'string') {
            return {
                kind: 'failure',
                error: {
                    name: 'ValidationError',
                    code: 'VALIDATION_ERROR',
                    message: 'tenantId is required and must be a string',
                    isRecoverable: true,
                },
            };
        }
        if (!command.confirmation) {
            return {
                kind: 'failure',
                error: {
                    name: 'ValidationError',
                    code: 'MISSING_CONFIRMATION',
                    message: 'Hard reset requires confirmation token. Generate token first.',
                    isRecoverable: true,
                },
            };
        }
        return { kind: 'success', value: undefined };
    }
    async executeCore(command, context) {
        this.logger.info('Starting HARD tenant reset', {
            tenantId: command.tenantId,
            confirmedAt: command.confirmation.confirmedAt,
            dryRun: context.dryRun,
        });
        if (context.dryRun) {
            this.logger.info('Dry run mode - no data will be deleted');
            return {
                kind: 'success',
                value: {
                    success: true,
                    mode: 'HARD',
                    message: 'Dry run completed - no data was modified',
                    data: {
                        tenantId: command.tenantId,
                        deletedMetrics: 0,
                        deletedAlerts: 0,
                        deletedCampaigns: 0,
                        deletedAlertDefinitions: 0,
                        durationMs: 0,
                    },
                },
            };
        }
        const result = await this.resetService.hardReset(command.tenantId, command.confirmation);
        if (result.success) {
            this.logger.info('Hard reset completed', {
                tenantId: command.tenantId,
                deletedMetrics: result.data?.deletedMetrics ?? 0,
                deletedCampaigns: result.data?.deletedCampaigns ?? 0,
                deletedAlertDefinitions: result.data?.deletedAlertDefinitions ?? 0,
                durationMs: result.data?.durationMs ?? 0,
            });
            return { kind: 'success', value: result };
        }
        else {
            const error = new Error(result.message);
            this.logger.error('Hard reset failed', error, {
                tenantId: command.tenantId,
                detail: result.error,
            });
            return {
                kind: 'failure',
                error: {
                    name: 'ResetError',
                    code: 'RESET_FAILED',
                    message: result.message,
                    isRecoverable: result.error?.includes('expired') ?? true,
                },
            };
        }
    }
    generateConfirmationToken(tenantId) {
        return this.resetService.generateConfirmationToken(tenantId);
    }
};
exports.ResetTenantHardCommandHandler = ResetTenantHardCommandHandler;
exports.ResetTenantHardCommandHandler = ResetTenantHardCommandHandler = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(container_1.TOKENS.Logger)),
    __param(1, (0, tsyringe_1.inject)(tenant_reset_service_1.TenantResetService)),
    __metadata("design:paramtypes", [Object, tenant_reset_service_1.TenantResetService])
], ResetTenantHardCommandHandler);
//# sourceMappingURL=reset-tenant.handler.js.map