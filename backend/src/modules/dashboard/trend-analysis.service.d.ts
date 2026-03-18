import { PrismaService } from '../prisma/prisma.service';
import { GetTrendAnalysisDto, TrendDataResponseDto } from './dto/trend-analysis.dto';
export declare class TrendAnalysisService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toNumber;
    getTrends(tenantId: string, query: GetTrendAnalysisDto): Promise<TrendDataResponseDto[]>;
}
