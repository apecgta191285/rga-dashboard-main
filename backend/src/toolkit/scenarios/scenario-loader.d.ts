import { ScenarioSpec } from './scenario-types';
export interface ScenarioLoaderOptions {
    baseDir?: string;
}
export interface ScenarioOption {
    scenarioId: string;
    name: string;
    aliases: string[];
}
export declare class ScenarioError extends Error {
    readonly code: string;
    readonly exitCode: number;
    constructor(code: string, exitCode: number, message: string);
}
export declare class ScenarioLoader {
    private readonly baseDir;
    constructor();
    setBaseDir(dir: string): void;
    load(nameOrId: string): Promise<ScenarioSpec>;
    listAvailableScenarios(): Promise<ScenarioOption[]>;
    private findFile;
    private listScenarioFiles;
    private isSafePath;
    private loadFromFile;
}
