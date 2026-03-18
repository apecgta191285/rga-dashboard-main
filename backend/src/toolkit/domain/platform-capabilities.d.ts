import { ToolkitPlatform } from './platform.types';
export interface PlatformCapabilityDef {
    readonly label: string;
    readonly icon: string;
    readonly isSeedable: boolean;
    readonly isSimulatable: boolean;
}
export declare const PLATFORM_CAPABILITIES: Record<ToolkitPlatform, PlatformCapabilityDef>;
export declare const SEEDABLE_PLATFORMS: ToolkitPlatform[];
export declare const SIMULATABLE_PLATFORMS: ToolkitPlatform[];
