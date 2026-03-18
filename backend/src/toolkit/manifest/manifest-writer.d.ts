import { ManifestDocument } from './types';
export declare class ManifestWriter {
    static serialize(manifest: ManifestDocument): {
        json: string | null;
        sizeBytes: number;
        maxBytes: number;
    };
    static resolveDir(flagValue: string | null | undefined): string;
    static generateFilename(runId: string, commandName: string): string;
    static write(manifest: ManifestDocument, manifestDir?: string): Promise<string | null>;
    static cleanupOrphans(dir: string, maxAgeMs?: number): Promise<number>;
}
