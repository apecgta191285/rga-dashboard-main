import { ICommand, CommandName } from '../../core/contracts';
export declare const ALERT_SCENARIO_COMMAND: CommandName;
export interface AlertScenarioCommand extends ICommand {
    readonly name: typeof ALERT_SCENARIO_COMMAND;
    readonly tenantId: string;
    readonly seedBaseline: boolean;
    readonly injectAnomaly: boolean;
    readonly days: number;
}
export declare function createAlertScenarioCommand(tenantId: string, options?: {
    seedBaseline?: boolean;
    injectAnomaly?: boolean;
    days?: number;
}): AlertScenarioCommand;
