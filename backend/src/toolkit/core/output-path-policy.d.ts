export type OutputPathKind = 'manifest' | 'report';
export declare class OutputPathPolicyError extends Error {
    readonly code = "OUTPUT_PATH_BLOCKED";
    readonly exitCode = 78;
    constructor(message: string);
}
export declare function getDefaultOutputRoot(kind: OutputPathKind): string;
export declare function getAllowedOutputRoots(kind: OutputPathKind): string[];
export declare function resolveOutputDir(kind: OutputPathKind, requestedDir?: string | null): string;
