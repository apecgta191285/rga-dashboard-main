import { DebugService } from './debug.service';
export declare class DebugController {
    private readonly debugService;
    private readonly logger;
    constructor(debugService: DebugService);
    clearMockData(): Promise<{
        success: boolean;
        deletedMetrics: number;
        deletedGA4Records: number;
    }>;
}
