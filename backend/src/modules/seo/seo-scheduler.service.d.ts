import { SeoRollupService } from './seo-rollup.service';
export declare class SeoSchedulerService {
    private readonly seoRollupService;
    private readonly logger;
    constructor(seoRollupService: SeoRollupService);
    rollupYesterday(): Promise<void>;
}
