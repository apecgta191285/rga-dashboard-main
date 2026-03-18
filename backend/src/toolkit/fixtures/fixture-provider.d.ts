import { GoldenFixture } from '../scenarios/scenario-types';
export interface FixtureProviderOptions {
    baseDir?: string;
}
export declare class FixtureError extends Error {
    readonly code: string;
    readonly exitCode: number;
    constructor(code: string, exitCode: number, message: string);
}
export declare class FixtureProvider {
    private readonly baseDir;
    constructor(options?: FixtureProviderOptions);
    loadFixture(scenarioId: string, seed: number): Promise<GoldenFixture>;
    private computeChecksum;
    private deepSortKeys;
}
