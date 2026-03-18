export declare enum CrmPeriod {
    D7 = "7d",
    D30 = "30d",
    THIS_MONTH = "this_month",
    LAST_MONTH = "last_month"
}
export declare class GetCrmSummaryDto {
    period?: CrmPeriod;
    tenantId?: string;
}
export declare class CrmSummaryResponseDto {
    totalLeads: number;
    leadsTrend: number;
    qualifiedLeads: number;
    qualifiedTrend: number;
    conversionRate: number;
    conversionTrend: number;
    costPerLead: number;
    cplTrend: number;
    pipelineValue: number;
    pipelineTrend: number;
}
