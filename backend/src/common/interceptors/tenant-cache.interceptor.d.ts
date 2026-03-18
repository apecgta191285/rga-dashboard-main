import { ExecutionContext } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
export declare class TenantCacheInterceptor extends CacheInterceptor {
    trackBy(context: ExecutionContext): string | undefined;
}
