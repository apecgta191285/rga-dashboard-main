import { ToolkitPlatform } from './platform.types';
import { Result } from '../core/contracts';
import { ToolkitError } from '../core/contracts';
export declare const PLATFORM_ALIASES: Record<string, ToolkitPlatform>;
export declare class UnsupportedPlatformError extends ToolkitError {
    readonly value: string;
    readonly context: string;
    readonly code = "UNSUPPORTED_PLATFORM";
    readonly isRecoverable = false;
    constructor(value: string, context: string);
}
export declare function normalizePlatformInput(input: string): Result<ToolkitPlatform>;
