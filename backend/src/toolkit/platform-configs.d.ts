import { ToolkitPlatform } from './domain/platform.types';
export interface PlatformSimulationConfig {
    platform: ToolkitPlatform;
    label: string;
    ctrRange: [number, number];
    cpcRange: [number, number];
    cvrRange: [number, number];
    aovRange: [number, number];
    impressionMultiplier: number;
    weekendFactor?: number;
    distributionProfile?: 'EVEN' | 'PEAK_EVENING' | 'PEAK_LUNCH' | 'PEAK_MORNING';
}
export declare const PLATFORM_CONFIGS: Record<string, PlatformSimulationConfig>;
export declare function getPlatformConfig(platform?: ToolkitPlatform): PlatformSimulationConfig;
export declare const SIMULATABLE_PLATFORMS: ToolkitPlatform[];
export declare const PLATFORM_ALIASES: Record<string, ToolkitPlatform>;
export declare function getPlatformIcon(platform: ToolkitPlatform): string;
