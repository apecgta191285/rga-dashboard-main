import { ICommandHandler, IExecutionContext, Result, ILogger } from '../core/contracts';
import { BaseCommandHandler } from './base-command';
import { AlertScenarioCommand } from './definitions/alert-scenario.command';
import { AlertScenarioService, AlertScenarioResult } from '../services/alert-scenario.service';
export declare class AlertScenarioCommandHandler extends BaseCommandHandler<AlertScenarioCommand, AlertScenarioResult> implements ICommandHandler<AlertScenarioCommand, AlertScenarioResult> {
    readonly commandName: import("../core/contracts").CommandName;
    private readonly scenarioService;
    constructor(logger: ILogger, scenarioService: AlertScenarioService);
    canHandle(command: unknown): command is AlertScenarioCommand;
    getMetadata(): {
        name: import("../core/contracts").CommandName;
        displayName: string;
        description: string;
        icon: string;
        category: "testing";
        estimatedDurationSeconds: number;
        risks: string[];
    };
    validate(command: AlertScenarioCommand): Result<void>;
    protected executeCore(command: AlertScenarioCommand, context: IExecutionContext): Promise<Result<AlertScenarioResult>>;
}
