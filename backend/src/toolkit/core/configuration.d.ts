import { IToolkitConfiguration, ToolkitError } from './contracts';
export declare function loadConfiguration(): IToolkitConfiguration;
export declare class ConfigurationError extends ToolkitError {
    readonly code = "CONFIGURATION_ERROR";
    readonly isRecoverable = false;
    constructor(message: string);
}
