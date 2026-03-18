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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertScenarioCommandHandler = void 0;
const tsyringe_1 = require("tsyringe");
const cli_progress_1 = __importDefault(require("cli-progress"));
const base_command_1 = require("./base-command");
const alert_scenario_command_1 = require("./definitions/alert-scenario.command");
const alert_scenario_service_1 = require("../services/alert-scenario.service");
const container_1 = require("../core/container");
class CliProgressReporter {
    constructor() {
        this.bar = new cli_progress_1.default.SingleBar({
            format: 'Step {step} |{bar}| {percentage}% | {message}',
            barCompleteChar: '█',
            barIncompleteChar: '░',
            hideCursor: true,
            clearOnComplete: false,
            stopOnComplete: true,
        }, cli_progress_1.default.Presets.shades_classic);
    }
    start(total) {
        this.bar.start(total, 0, { step: '1/3', message: '' });
    }
    update(current, message) {
        this.bar.update(current, { message: message || '' });
    }
    stop() {
        this.bar.stop();
        console.log('');
    }
}
let AlertScenarioCommandHandler = class AlertScenarioCommandHandler extends base_command_1.BaseCommandHandler {
    constructor(logger, scenarioService) {
        super({ logger });
        this.commandName = alert_scenario_command_1.ALERT_SCENARIO_COMMAND;
        this.scenarioService = scenarioService;
    }
    canHandle(command) {
        return (typeof command === 'object' &&
            command !== null &&
            'name' in command &&
            command.name === alert_scenario_command_1.ALERT_SCENARIO_COMMAND);
    }
    getMetadata() {
        return {
            name: alert_scenario_command_1.ALERT_SCENARIO_COMMAND,
            displayName: 'Run Alert Scenario',
            description: 'Seed baseline data, inject anomalies, and trigger alert evaluation',
            icon: '🚨',
            category: 'testing',
            estimatedDurationSeconds: 45,
            risks: [
                'Creates mock data in database',
                'May trigger alert notifications',
                'Modifies campaign metrics',
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
        if (typeof command.days !== 'number' || command.days < 1 || command.days > 365) {
            return {
                kind: 'failure',
                error: {
                    name: 'ValidationError',
                    code: 'VALIDATION_ERROR',
                    message: 'days must be a number between 1 and 365',
                    isRecoverable: true,
                },
            };
        }
        return { kind: 'success', value: undefined };
    }
    async executeCore(command, context) {
        this.logger.info('Starting alert scenario', {
            tenantId: command.tenantId,
            seedBaseline: command.seedBaseline,
            injectAnomaly: command.injectAnomaly,
            days: command.days,
            dryRun: context.dryRun,
        });
        await this.scenarioService.assertSchemaParity();
        if (context.dryRun) {
            this.logger.info('Dry run mode - skipping actual execution');
            return {
                kind: 'success',
                value: {
                    success: true,
                    status: 'completed',
                    message: 'Dry run completed - no data was modified',
                    data: {
                        tenantId: command.tenantId,
                        seedResult: {
                            seededCount: 0,
                            campaignCount: 0,
                            dateRange: { start: '', end: '' },
                        },
                        anomalyInjected: false,
                        alertCheck: {
                            success: true,
                            triggeredAlerts: [],
                            evaluatedAt: new Date(),
                            metadata: {
                                snapshotsEvaluated: 0,
                                totalRulesEvaluated: 0,
                                totalRulesTriggered: 0,
                                durationMs: 0,
                            },
                        },
                    },
                },
            };
        }
        const progressReporter = new CliProgressReporter();
        const result = await this.scenarioService.execute({
            tenantId: command.tenantId,
            days: command.days,
            injectAnomaly: command.injectAnomaly,
            autoCreateCampaigns: false,
        }, progressReporter);
        if (result.success) {
            this.logger.info('Alert scenario completed', {
                status: result.status,
                seedCount: result.data?.seedResult.seededCount ?? 0,
                anomalyInjected: result.data?.anomalyInjected ?? false,
                alertsTriggered: result.data?.alertCheck.triggeredAlerts.length ?? 0,
            });
            return { kind: 'success', value: result };
        }
        else {
            const error = new Error(result.message);
            this.logger.error('Alert scenario failed', error, {
                status: result.status,
                detail: result.error,
            });
            return {
                kind: 'failure',
                error: {
                    name: 'AlertScenarioError',
                    code: result.status === 'no_campaigns' ? 'NO_CAMPAIGNS' : 'SCENARIO_FAILED',
                    message: result.message,
                    isRecoverable: result.status === 'no_campaigns',
                },
            };
        }
    }
};
exports.AlertScenarioCommandHandler = AlertScenarioCommandHandler;
exports.AlertScenarioCommandHandler = AlertScenarioCommandHandler = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(container_1.TOKENS.Logger)),
    __param(1, (0, tsyringe_1.inject)(alert_scenario_service_1.AlertScenarioService)),
    __metadata("design:paramtypes", [Object, alert_scenario_service_1.AlertScenarioService])
], AlertScenarioCommandHandler);
//# sourceMappingURL=alert-scenario.handler.js.map