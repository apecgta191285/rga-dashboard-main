export declare const TRUNCATION_LIMITS: {
    readonly STEP_SUMMARY: 200;
    readonly ERROR_MESSAGE: 500;
    readonly ARG_VALUE: 1000;
    readonly MAX_WARNINGS: 50;
    readonly MAX_ERRORS: 10;
    readonly MAX_MANIFEST_BYTES: number;
};
export declare function isForbiddenKey(key: string): boolean;
export declare function isSafeKey(key: string): boolean;
export declare function maskDatabaseUrl(url: string): string;
export declare function redactEnvEntry(key: string, value: string): {
    key: string;
    value: string;
} | null;
export declare function redactArgs(args: Record<string, unknown>): Record<string, unknown>;
export declare function truncate(value: string, maxLength: number): string;
export declare function scrubMessage(value: string): string;
export declare function sanitizeError(error: unknown): {
    code: string;
    message: string;
    isRecoverable: boolean;
};
export declare function redactEnv(env: Record<string, string | undefined>): Record<string, string>;
export declare function limitArray<T>(arr: T[], max: number, warningPrefix: string): {
    items: T[];
    truncatedWarning: string | null;
};
