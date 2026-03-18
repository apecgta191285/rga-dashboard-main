import { AdPlatform } from '@prisma/client';
import { ToolkitPlatform } from '../domain/platform.types';
import { Result } from '../core/contracts';
export declare class PlatformMapper {
    private static readonly DOMAIN_TO_PERSISTENCE;
    static toPersistence(domain: ToolkitPlatform): AdPlatform;
    static toDomain(raw: AdPlatform | string): Result<ToolkitPlatform>;
}
