import { useMemo, useState } from 'react';
import {
    AlertTriangle,
    Bot,
    Lightbulb,
    SearchCode,
    Send,
    Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardDateFilter } from '@/features/dashboard/components/dashboard-date-filter';
import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard';
import type { PeriodEnum, RecentCampaign } from '@/features/dashboard/schemas';
import { formatCurrencyTHB, formatNumber } from '@/lib/formatters';
import { apiClient } from '@/services/api-client';

interface DerivedMetrics {
    revenue: number;
    cost: number;
    profit: number;
    roi: number;
    roas: number;
    ctr: number;
    cpa: number;
    cpc: number;
    conversionRate: number;
    cac: number;
    ltv: number;
    cpcGrowth: number | null;
}

interface InsightItem {
    title: string;
    detail: string;
    level: 'info' | 'warning' | 'critical';
}

interface RecommendationItem {
    title: string;
    reason: string;
    action: string;
}

interface QueryResult {
    queryType: 'SQL' | 'API' | 'OUT_OF_SCOPE';
    generatedQuery: string;
    answer: string;
}

interface AiChatApiResponse {
    question: string;
    intent: string;
    queryType: 'SQL' | 'ANALYSIS';
    answer: string;
    generatedQuery?: string;
    evidence: Array<{
        label: string;
        value: string;
    }>;
}

interface ChatMessage {
    role: 'assistant' | 'user';
    content: string;
}

interface QueryContext {
    derived: DerivedMetrics;
    campaigns: RecentCampaign[];
    period: PeriodEnum;
}

const safeDivide = (numerator: number, denominator: number) => {
    if (denominator <= 0) {
        return 0;
    }

    return numerator / denominator;
};

const previousValueFromGrowth = (current: number, growth: number | null | undefined) => {
    if (growth === null || growth === undefined) {
        return null;
    }

    const ratio = 1 + growth / 100;
    if (ratio <= 0) {
        return null;
    }

    return current / ratio;
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const platformMatcher = (question: string) => {
    const normalized = question.toLowerCase();

    if (normalized.includes('shopee')) return 'SHOPEE';
    if (normalized.includes('lazada')) return 'LAZADA';
    if (normalized.includes('facebook')) return 'FACEBOOK';
    if (normalized.includes('google')) return 'GOOGLE_ADS';
    if (normalized.includes('tiktok')) return 'TIKTOK';

    return null;
};

const buildNaturalLanguageResult = (question: string, context: QueryContext): QueryResult => {
    const normalized = question.toLowerCase().trim();
    const { derived, campaigns, period } = context;

    const periodLabel =
        period === '7d'
            ? '7 วันล่าสุด'
            : period === '30d'
              ? '30 วันล่าสุด'
              : period === 'this_month'
                ? 'เดือนนี้'
                : period === 'last_month'
                  ? 'เดือนก่อน'
                  : 'ช่วงที่เลือก';

    const platform = platformMatcher(question);

    if (normalized.includes('ยอดขาย') || normalized.includes('รายได้')) {
        if (platform) {
            const platformSpend = campaigns
                .filter((campaign) => campaign.platform === platform)
                .reduce((sum, campaign) => sum + campaign.spending, 0);
            const estimatedRevenue = platformSpend * derived.roas;

            return {
                queryType: 'SQL',
                generatedQuery: `SELECT SUM(spending) AS spend FROM campaigns WHERE platform = '${platform}' AND period = '${period}';`,
                answer: `ประมาณการรายได้จาก ${platform} ใน${periodLabel}: ${formatCurrencyTHB(estimatedRevenue)} (คำนวณจาก spending x ROAS เฉลี่ย)`,
            };
        }

        return {
            queryType: 'SQL',
            generatedQuery: `SELECT SUM(revenue) AS revenue FROM fact_marketing WHERE period = '${period}';`,
            answer: `ประมาณการรายได้รวมใน${periodLabel}: ${formatCurrencyTHB(derived.revenue)}`,
        };
    }

    if (normalized.includes('ctr')) {
        return {
            queryType: 'API',
            generatedQuery: `GET /dashboard/overview?period=${period} -> summary.averageCtr`,
            answer: `CTR เฉลี่ยใน${periodLabel}: ${formatPercent(derived.ctr)}`,
        };
    }

    if (normalized.includes('cpa') || normalized.includes('cost per acquisition')) {
        return {
            queryType: 'API',
            generatedQuery: `GET /dashboard/overview?period=${period} -> summary.totalCost, summary.totalConversions`,
            answer: `CPA ใน${periodLabel}: ${formatCurrencyTHB(derived.cpa)} ต่อ 1 conversion`,
        };
    }

    if (normalized.includes('roi') || normalized.includes('roas')) {
        return {
            queryType: 'API',
            generatedQuery: `GET /dashboard/overview?period=${period} -> summary.averageRoas + derived.roi`,
            answer: `ROI: ${formatPercent(derived.roi)} | ROAS: ${derived.roas.toFixed(2)}x`,
        };
    }

    if (
        normalized.includes('เกินงบ') ||
        normalized.includes('over budget') ||
        (normalized.includes('budget') && normalized.includes('เกิน')) ||
        (normalized.includes('งบ') && normalized.includes('เกิน'))
    ) {
        const overBudget = campaigns
            .filter((campaign) => (campaign.budgetUtilization ?? 0) > 100)
            .sort((a, b) => (b.budgetUtilization ?? 0) - (a.budgetUtilization ?? 0));

        if (overBudget.length === 0) {
            return {
                queryType: 'SQL',
                generatedQuery: `SELECT name, budget_utilization FROM campaigns WHERE budget_utilization > 100 ORDER BY budget_utilization DESC;`,
                answer: 'ยังไม่พบแคมเปญที่ใช้ทรัพยากรเกินงบจากข้อมูลล่าสุด',
            };
        }

        const topCampaign = overBudget[0];
        return {
            queryType: 'SQL',
            generatedQuery: `SELECT name, budget_utilization FROM campaigns WHERE budget_utilization > 100 ORDER BY budget_utilization DESC LIMIT 3;`,
            answer: `แคมเปญที่เสี่ยงสุด: ${topCampaign.name} ใช้งบ ${formatPercent(topCampaign.budgetUtilization ?? 0)}`,
        };
    }

    return {
        queryType: 'OUT_OF_SCOPE',
        generatedQuery: 'N/A',
        answer:
            'คำถามนี้อยู่นอกขอบเขตข้อมูลแดชบอร์ด ตอนนี้ตอบได้เฉพาะ analytics เช่น budget, revenue, CTR, CPC, CPA, ROI, ROAS.',
    };
};

const KPI_CARD_STYLES: Record<string, string> = {
    Revenue: 'border-blue-500/20 bg-blue-500/5',
    Cost: 'border-amber-500/20 bg-amber-500/5',
    Profit: 'border-emerald-500/20 bg-emerald-500/5',
    ROI: 'border-violet-500/20 bg-violet-500/5',
    CAC: 'border-rose-500/20 bg-rose-500/5',
    LTV: 'border-cyan-500/20 bg-cyan-500/5',
};

export default function AiInsights() {
    const [period, setPeriod] = useState<PeriodEnum>('7d');
    const [queryInput, setQueryInput] = useState('ยอดขายเดือนนี้จาก Shopee เป็นเท่าไร');
    const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'AI Assistant พร้อมใช้งานแล้ว ลองถามเช่น: โครงการไหนกำลังใช้ทรัพยากรเกินงบ?',
        },
    ]);

    const { data, isLoading, error, refetch } = useDashboardOverview({
        period,
        refetchInterval: 30_000,
        staleTime: 15_000,
    });

    const summary = data?.summary;
    const growth = data?.growth;
    const campaigns = data?.recentCampaigns ?? [];

    const derived = useMemo<DerivedMetrics>(() => {
        const cost = summary?.totalCost ?? 0;
        const roas = summary?.averageRoas ?? 0;
        const revenue = cost * roas;
        const profit = revenue - cost;
        const roi = safeDivide(profit, cost) * 100;
        const ctr = summary?.averageCtr ?? 0;
        const cpa = safeDivide(cost, summary?.totalConversions ?? 0);
        const cpc = safeDivide(cost, summary?.totalClicks ?? 0);
        const conversionRate = safeDivide(summary?.totalConversions ?? 0, summary?.totalClicks ?? 0) * 100;
        const cac = cpa;
        const ltv = safeDivide(revenue, summary?.totalConversions ?? 0) * 3;

        const previousCost = previousValueFromGrowth(cost, growth?.costGrowth);
        const previousClicks = previousValueFromGrowth(summary?.totalClicks ?? 0, growth?.clicksGrowth);
        const previousCpc =
            previousCost !== null && previousClicks !== null
                ? safeDivide(previousCost, previousClicks)
                : null;

        const cpcGrowth =
            previousCpc !== null && previousCpc > 0
                ? ((cpc - previousCpc) / previousCpc) * 100
                : null;

        return {
            revenue,
            cost,
            profit,
            roi,
            roas,
            ctr,
            cpa,
            cpc,
            conversionRate,
            cac,
            ltv,
            cpcGrowth,
        };
    }, [summary, growth]);

    const kpiCards = useMemo(
        () => [
            { label: 'Revenue', value: formatCurrencyTHB(derived.revenue) },
            { label: 'Cost', value: formatCurrencyTHB(derived.cost) },
            { label: 'Profit', value: formatCurrencyTHB(derived.profit) },
            { label: 'ROI', value: formatPercent(derived.roi) },
            { label: 'CAC', value: formatCurrencyTHB(derived.cac) },
            { label: 'LTV', value: formatCurrencyTHB(derived.ltv) },
        ],
        [derived]
    );

    const insightItems = useMemo<InsightItem[]>(() => {
        const items: InsightItem[] = [];

        if (!summary) {
            return [
                {
                    title: 'กำลังรวบรวมข้อมูล',
                    detail: 'ระบบจะสร้าง Insight อัตโนมัติเมื่อมีข้อมูลเพียงพอ',
                    level: 'info',
                },
            ];
        }

        items.push({
            title: 'CTR',
            detail: `CTR เฉลี่ยอยู่ที่ ${formatPercent(derived.ctr)}`,
            level: derived.ctr < 1 ? 'warning' : 'info',
        });

        items.push({
            title: 'CPA',
            detail: `CPA ปัจจุบัน ${formatCurrencyTHB(derived.cpa)} ต่อ conversion`,
            level: derived.cpa > 600 ? 'warning' : 'info',
        });

        items.push({
            title: 'ROI / ROAS',
            detail: `ROI ${formatPercent(derived.roi)} และ ROAS ${derived.roas.toFixed(2)}x`,
            level: derived.roas < 1.8 ? 'warning' : 'info',
        });

        items.push({
            title: 'Conversion Rate',
            detail: `Conversion Rate ${formatPercent(derived.conversionRate)}`,
            level: derived.conversionRate < 2 ? 'warning' : 'info',
        });

        return items;
    }, [summary, derived]);

    const recommendationItems = useMemo<RecommendationItem[]>(() => {
        const recommendations: RecommendationItem[] = [];

        if (!summary) {
            return recommendations;
        }

        if (derived.roas < 1.6) {
            recommendations.push({
                title: 'ปรับกลุ่มเป้าหมาย',
                reason: 'ROAS ต่ำกว่ามาตรฐาน',
                action: 'โฟกัสกลุ่มที่มี CPA ต่ำและเพิ่มงบใน campaign ที่กำไรสูง',
            });
        }

        if (derived.conversionRate < 2) {
            recommendations.push({
                title: 'ปรับ Landing Page',
                reason: 'Conversion Rate ต่ำกว่ามาตรฐาน',
                action: 'ทดสอบหัวข้อใหม่และเพิ่ม social proof เพื่อเพิ่มการตัดสินใจ',
            });
        }

        if (derived.ctr < 1) {
            recommendations.push({
                title: 'รีเฟรช Creative',
                reason: 'CTR ต่ำ',
                action: 'เพิ่มครีเอทีฟใหม่ 2-3 แบบและทดสอบกลุ่มเป้าหมาย',
            });
        }

        if (derived.cpcGrowth !== null && derived.cpcGrowth > 20) {
            recommendations.push({
                title: 'ลด Bid บาง Keyword',
                reason: 'CPC สูงผิดปกติ',
                action: 'ลด bid ใน keyword ที่ cost สูงแต่ conversion ต่ำ',
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                title: 'รักษาแผนปัจจุบัน',
                reason: 'ตัวเลขหลักอยู่ในระดับดี',
                action: 'เพิ่มงบทดลอง 10-15% ในแคมเปญที่กำไรสูงสุด',
            });
        }

        return recommendations.slice(0, 5);
    }, [summary, derived]);

    const aiSummaryText = useMemo(() => {
        if (!summary) {
            return 'ระบบกำลังรอข้อมูลเพื่อสรุปสถานการณ์ธุรกิจอัตโนมัติ';
        }

        const conversionTrend = growth?.conversionsGrowth ?? 0;
        const costTrend = growth?.costGrowth ?? 0;
        const direction = conversionTrend >= 0 ? 'เพิ่มขึ้น' : 'ลดลง';

        return `ยอดขายประมาณ ${formatCurrencyTHB(derived.revenue)} โดยกำไรสุทธิ ${formatCurrencyTHB(
            derived.profit
        )}. Conversion ${direction} ${formatPercent(Math.abs(conversionTrend))} และต้นทุนเปลี่ยนแปลง ${formatPercent(
            costTrend
        )}.`;
    }, [summary, growth, derived]);

    const runNaturalQuery = () => {
        const result = buildNaturalLanguageResult(queryInput, {
            derived,
            campaigns,
            period,
        });
        setQueryResult(result);
    };

    const sendChat = async () => {
        const question = chatInput.trim();
        if (!question || isChatLoading) return;

        setChatMessages((prev) => [...prev, { role: 'user', content: question }]);
        setChatInput('');
        setIsChatLoading(true);

        try {
            const response = await apiClient.post<AiChatApiResponse>('/dashboard/ai-chat', {
                question,
                period,
            });

            const data = response.data;
            const evidenceText = data.evidence
                .slice(0, 3)
                .map((item) => `${item.label}: ${item.value}`)
                .join('\n');

            const messageParts = [data.answer];
            if (evidenceText) {
                messageParts.push(`Evidence:\n${evidenceText}`);
            }
            if (data.generatedQuery) {
                messageParts.push(`Query:\n${data.generatedQuery}`);
            }

            setChatMessages((prev) => [
                ...prev,
                { role: 'assistant', content: messageParts.join('\n\n') },
            ]);
        } catch {
            const fallback = buildNaturalLanguageResult(question, {
                derived,
                campaigns,
                period,
            });

            const fallbackMessage =
                fallback.queryType === 'OUT_OF_SCOPE'
                    ? fallback.answer
                    : `${fallback.answer}\n\nAction: ${recommendationItems[0]?.action ?? 'No additional recommendation'}`;

            setChatMessages((prev) => [
                ...prev,
                { role: 'assistant', content: fallbackMessage },
            ]);
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">AI Insights & Tools</h2>
                        <p className="text-muted-foreground">
                            วิเคราะห์ภาพรวมอัตโนมัติ พร้อมเครื่องมือถามตอบเชิงลึกจากข้อมูลล่าสุด
                        </p>
                    </div>
                    <DashboardDateFilter value={period} onValueChange={setPeriod} />
                </div>

                {error && (
                    <Card className="border-destructive/40 bg-destructive/5">
                        <CardContent className="pt-6 flex items-center justify-between gap-4">
                            <div>
                                <p className="font-medium">โหลดข้อมูลไม่สำเร็จ</p>
                                <p className="text-sm text-muted-foreground">{error.message}</p>
                            </div>
                            <Button variant="outline" onClick={() => refetch()}>
                                Retry
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        <h3 className="font-semibold">KPI Overview (Real-time)</h3>
                        <Badge variant="secondary">Auto-refresh 30s</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {kpiCards.map((card) => (
                            <Card key={card.label} className={KPI_CARD_STYLES[card.label] ?? ''}>
                                <CardHeader className="pb-2">
                                    <CardDescription>{card.label}</CardDescription>
                                    <CardTitle className="text-xl">
                                        {isLoading ? 'Loading...' : card.value}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border-orange-200/60 bg-orange-50/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-orange-500" />
                                AI Summary
                            </CardTitle>
                            <CardDescription>
                                สรุปสถานการณ์ธุรกิจอัตโนมัติจากข้อมูลล่าสุด
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-16 w-full" />
                            ) : (
                                <p className="text-sm leading-relaxed text-muted-foreground">{aiSummaryText}</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                Live Insights
                            </CardTitle>
                            <CardDescription>สรุปสัญญาณสำคัญจาก KPI</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {insightItems.map((item, index) => (
                                <div key={`${item.title}-${index}`} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">{item.title}</p>
                                        <Badge
                                            variant={item.level === 'critical' ? 'destructive' : item.level === 'warning' ? 'secondary' : 'outline'}
                                        >
                                            {item.level.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                                    {index < insightItems.length - 1 && <Separator />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <SearchCode className="h-4 w-4 text-orange-500" />
                                Smart Query
                            </CardTitle>
                            <CardDescription>
                                สอบถามข้อมูลแบบธรรมชาติแล้วรับคำตอบพร้อมหลักฐาน
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                value={queryInput}
                                onChange={(event) => setQueryInput(event.target.value)}
                                placeholder="พิมพ์คำถาม เช่น รายได้ 30 วันล่าสุด"
                            />
                            <Button onClick={runNaturalQuery} className="w-full">
                                วิเคราะห์คำถาม
                            </Button>

                            {queryResult && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                                    <p className="text-xs text-muted-foreground">ผลลัพธ์</p>
                                    <p className="text-sm font-medium">{queryResult.answer}</p>
                                    <div className="text-xs text-muted-foreground whitespace-pre-line">
                                        {queryResult.generatedQuery}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="h-4 w-4 text-orange-500" />
                                AI Assistant
                            </CardTitle>
                            <CardDescription>ถาม-ตอบแบบสนทนา พร้อม Evidence และ Query</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="max-h-64 overflow-y-auto space-y-3">
                                {chatMessages.map((message, index) => (
                                    <div
                                        key={`${message.role}-${index}`}
                                        className={`rounded-lg border px-3 py-2 text-sm whitespace-pre-line ${
                                            message.role === 'assistant'
                                                ? 'bg-slate-50 border-slate-200'
                                                : 'bg-orange-50/70 border-orange-200'
                                        }`}
                                    >
                                        <p className="text-xs text-muted-foreground mb-1">
                                            {message.role === 'assistant' ? 'Assistant' : 'You'}
                                        </p>
                                        <p className="text-sm">{message.content}</p>
                                    </div>
                                ))}
                            </div>
                            <Textarea
                                value={chatInput}
                                onChange={(event) => setChatInput(event.target.value)}
                                placeholder="ถามเช่น: ROI ของเดือนนี้เท่าไร"
                                rows={3}
                            />
                            <Button onClick={sendChat} disabled={isChatLoading} className="w-full">
                                {isChatLoading ? 'กำลังตอบ...' : (
                                    <span className="inline-flex items-center gap-2">
                                        ส่งคำถาม
                                        <Send className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-orange-500" />
                                Actionable Recommendations
                            </CardTitle>
                            <CardDescription>แนวทางปรับกลยุทธ์จากข้อมูลล่าสุด</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recommendationItems.map((item, index) => (
                                <div key={`${item.title}-${index}`} className="space-y-2">
                                    <p className="font-medium text-sm">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                                    <p className="text-sm">{item.action}</p>
                                    {index < recommendationItems.length - 1 && <Separator />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-orange-500" />
                                AI Notes
                            </CardTitle>
                            <CardDescription>สรุปตัวเลขหลักที่ควรแชร์ทีม</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                                <p className="text-xs text-muted-foreground">Highlight</p>
                                <p className="text-sm">
                                    งบโฆษณารวม {formatCurrencyTHB(derived.cost)} จาก {formatNumber(campaigns.length)} แคมเปญ
                                </p>
                                <p className="text-sm">
                                    ROAS เฉลี่ย {derived.roas.toFixed(2)}x | ROI {formatPercent(derived.roi)}
                                </p>
                                <p className="text-sm">
                                    Conversion Rate {formatPercent(derived.conversionRate)} และ CAC {formatCurrencyTHB(derived.cac)}
                                </p>
                            </div>
                            <Button variant="outline" className="w-full">
                                ส่งสรุปให้ทีม
                            </Button>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </DashboardLayout>
    );
}
