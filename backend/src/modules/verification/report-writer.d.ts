import { VerificationResult } from './types';
export declare class ReportWriter {
    private readonly logger;
    writeReport(result: VerificationResult, outputDir: string): Promise<string>;
    private canonicalize;
}
