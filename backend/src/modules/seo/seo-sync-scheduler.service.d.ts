import { PrismaService } from '../prisma/prisma.service';
import { SeoService } from './seo.service';
export declare class SeoSyncSchedulerService {
    private readonly prisma;
    private readonly seoService;
    private readonly logger;
    constructor(prisma: PrismaService, seoService: SeoService);
    scheduledGscSync(): Promise<void>;
}
