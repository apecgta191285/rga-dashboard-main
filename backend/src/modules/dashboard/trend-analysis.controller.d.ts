import { TrendAnalysisService } from './trend-analysis.service';
import { GetTrendAnalysisDto, TrendDataResponseDto } from './dto/trend-analysis.dto';
export declare class TrendAnalysisController {
    private readonly trendAnalysisService;
    constructor(trendAnalysisService: TrendAnalysisService);
    getTrends(user: any, query: GetTrendAnalysisDto): Promise<TrendDataResponseDto[]>;
}
