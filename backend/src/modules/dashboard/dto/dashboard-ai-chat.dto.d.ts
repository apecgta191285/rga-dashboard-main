import { PeriodEnum } from './dashboard-overview.dto';
export declare enum DashboardAiChatIntent {
    SUMMARY = "SUMMARY",
    REVENUE = "REVENUE",
    OVER_BUDGET = "OVER_BUDGET",
    CPC = "CPC",
    PERFORMANCE = "PERFORMANCE",
    TOP_CAMPAIGN = "TOP_CAMPAIGN",
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
}
export declare enum DashboardAiChatQueryType {
    SQL = "SQL",
    ANALYSIS = "ANALYSIS"
}
export declare class DashboardAiChatRequestDto {
    question: string;
    period?: PeriodEnum;
    tenantId?: string;
}
export declare class DashboardAiChatEvidenceDto {
    label: string;
    value: string;
}
export declare class DashboardAiChatDataDto {
    question: string;
    intent: DashboardAiChatIntent;
    queryType: DashboardAiChatQueryType;
    answer: string;
    generatedQuery?: string;
    evidence: DashboardAiChatEvidenceDto[];
}
export declare class DashboardAiChatMetaDto {
    period: PeriodEnum;
    tenantId: string;
    generatedAt: string;
}
export declare class DashboardAiChatResponseDto {
    success: boolean;
    data: DashboardAiChatDataDto;
    meta: DashboardAiChatMetaDto;
}
