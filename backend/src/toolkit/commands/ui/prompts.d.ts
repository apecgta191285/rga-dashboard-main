import { PrismaClient } from '@prisma/client';
import { ScenarioLoader } from '../../scenarios/scenario-loader';
export declare function promptForTenant(prisma: PrismaClient): Promise<import('../../core/contracts').TenantId | null>;
export declare function promptForTenantManual(): Promise<import('../../core/contracts').TenantId | null>;
export declare function promptForScenario(scenarioLoader: ScenarioLoader, message: string, fallbackScenarioId?: string): Promise<string>;
