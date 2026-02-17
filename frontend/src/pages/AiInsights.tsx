import { useMemo, useState } from 'react';
import {
    AlertTriangle,
    Bot,
    Lightbulb,
    SearchCode,
    Send,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Funnel,
    FunnelChart,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { DashboardDateFilter } from '@/features/dashboard/components/dashboard-date-filter';
import { TrendChart } from '@/features/dashboard/components/charts/trend-chart';
import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard';
import type {
    PeriodEnum,
    RecentCampaign,
    TrendDataPoint,
} from '@/features/dashboard/schemas';
import { formatCurrencyTHB, formatNumber } from '@/lib/formatters';

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
    queryType: 'SQL' | 'API';
    generatedQuery: string;
    answer: string;
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
                : 'เดือนก่อน';

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
        (normalized.includes('โครงการ') || normalized.includes('แคมเปญ')) &&
        (normalized.includes('เกินงบ') || normalized.includes('เกิน budget'))
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
        queryType: 'API',
        generatedQuery: `GET /dashboard/overview?period=${period}`,
        answer: `สรุปเร็ว: Revenue ${formatCurrencyTHB(derived.revenue)}, Cost ${formatCurrencyTHB(derived.cost)}, Profit ${formatCurrencyTHB(derived.profit)}`,
    };
};

const getHeatColor = (intensity: number) => {
    const alpha = Math.max(0.1, Math.min(0.95, intensity));
    return `rgba(59, 130, 246, ${alpha})`;
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
    const [budgetAdjustment, setBudgetAdjustment] = useState(15);
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content:
                'AI Assistant พร้อมใช้งานแล้ว ลองถามเช่น: โครงการไหนกำลังใช้ทรัพยากรเกินงบ?',
        },
    ]);

    const { data, isLoading, error, refetch } = useDashboardOverview({
        period,
        refetchInterval: 30_000,
        staleTime: 15_000,
    });

    const summary = data?.summary;
    const growth = data?.growth;
    const trends = data?.trends ?? [];
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

    const anomalyItems = useMemo<InsightItem[]>(() => {
        const anomalies: InsightItem[] = [];

        if (derived.cpcGrowth !== null && derived.cpcGrowth > 20) {
            anomalies.push({
                title: 'CPC ผิดปกติ',
                detail: `CPC เพิ่มขึ้น ${formatPercent(derived.cpcGrowth)} เทียบช่วงก่อนหน้า`,
                level: 'critical',
            });
        }

        if ((growth?.conversionsGrowth ?? 0) < -20) {
            anomalies.push({
                title: 'ยอด Conversion ลดลงแรง',
                detail: `Conversion ลดลง ${formatPercent(Math.abs(growth?.conversionsGrowth ?? 0))}`,
                level: 'critical',
            });
        }

        if ((growth?.costGrowth ?? 0) > 15 && (growth?.conversionsGrowth ?? 0) <= 0) {
            anomalies.push({
                title: 'Cost โตเร็วกว่าผลลัพธ์',
                detail: 'ค่าใช้จ่ายโฆษณาเพิ่ม แต่ Conversion ไม่โตตาม',
                level: 'warning',
            });
        }

        if (derived.roas > 0 && derived.roas < 1.5) {
            anomalies.push({
                title: 'ROAS ต่ำกว่าค่าปลอดภัย',
                detail: `ROAS อยู่ที่ ${derived.roas.toFixed(2)}x`,
                level: 'warning',
            });
        }

        if (anomalies.length === 0) {
            anomalies.push({
                title: 'ไม่พบความผิดปกติรุนแรง',
                detail: 'ตัวชี้วัดหลักยังอยู่ในกรอบปกติ',
                level: 'info',
            });
        }

        return anomalies;
    }, [growth, derived]);

    const recommendationItems = useMemo<RecommendationItem[]>(() => {
        const recommendations: RecommendationItem[] = [];

        if (derived.roas < 2) {
            recommendations.push({
                title: 'จัดงบตามผลตอบแทน',
                reason: 'ROAS ต่ำกว่าเป้าหมาย',
                action: 'เพิ่มงบในกลุ่มที่ ROAS สูง และลดงบกลุ่มที่ขาดทุน',
            });
        }

        if (derived.conversionRate < 2) {
            recommendations.push({
                title: 'ปรับ Landing Page',
                reason: 'Conversion Rate ต่ำกว่ามาตรฐาน',
                action: 'ทดสอบข้อความ, CTA และความเร็วหน้าเว็บ',
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
    }, [derived]);

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

    const whatIf = useMemo(() => {
        const budgetFactor = 1 + budgetAdjustment / 100;
        const demandElasticity = derived.roas >= 2 ? 0.78 : 0.55;
        const projectedRevenue = Math.max(
            0,
            derived.revenue * (1 + (budgetAdjustment * demandElasticity) / 100)
        );
        const projectedCost = Math.max(0, derived.cost * budgetFactor);
        const projectedProfit = projectedRevenue - projectedCost;
        const projectedRoi = safeDivide(projectedProfit, projectedCost) * 100;

        return {
            projectedRevenue,
            projectedCost,
            projectedProfit,
            projectedRoi,
        };
    }, [budgetAdjustment, derived]);

    const forecastData = useMemo(() => {
        if (!summary || trends.length === 0) {
            return [] as { month: string; revenue: number }[];
        }

        const dailyRevenue = trends.map((trend) => trend.cost * summary.averageRoas);
        const averageDailyRevenue =
            dailyRevenue.reduce((sum, value) => sum + value, 0) / dailyRevenue.length;

        const slope =
            dailyRevenue.length > 1
                ? (dailyRevenue[dailyRevenue.length - 1] - dailyRevenue[0]) /
                  (dailyRevenue.length - 1)
                : 0;

        const now = new Date();

        return [1, 2, 3].map((offset) => {
            const monthDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
            const monthlyBase = averageDailyRevenue * 30;
            const momentum = slope * 30 * offset;

            return {
                month: monthDate.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
                revenue: Math.max(0, monthlyBase + momentum),
            };
        });
    }, [summary, trends]);

    const campaignRankingData = useMemo(() => {
        if (!summary) {
            return [] as Array<{ name: string; spending: number; revenue: number }>;
        }

        const platformMultiplier: Record<string, number> = {
            GOOGLE_ADS: 1.08,
            FACEBOOK: 0.97,
            TIKTOK: 0.94,
            LINE_ADS: 0.9,
            SHOPEE: 1.02,
            LAZADA: 0.99,
            GOOGLE_ANALYTICS: 1,
        };

        return campaigns
            .map((campaign) => {
                const factor = platformMultiplier[campaign.platform] ?? 1;
                const estimatedRevenue = campaign.spending * summary.averageRoas * factor;

                return {
                    name:
                        campaign.name.length > 22
                            ? `${campaign.name.slice(0, 22)}...`
                            : campaign.name,
                    spending: Number(campaign.spending.toFixed(0)),
                    revenue: Number(estimatedRevenue.toFixed(0)),
                };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 6);
    }, [campaigns, summary]);

    const funnelData = useMemo(() => {
        if (!summary) {
            return [] as Array<{ name: string; value: number }>;
        }

        return [
            { name: 'Impressions', value: summary.totalImpressions },
            { name: 'Clicks', value: summary.totalClicks },
            { name: 'Conversions', value: summary.totalConversions },
        ];
    }, [summary]);

    const heatmapData = useMemo(() => {
        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const metricKeys = ['CTR', 'CVR', 'CPC', 'ROAS'] as const;

        const grouped = new Map<string, TrendDataPoint[]>();
        weekdays.forEach((weekday) => {
            grouped.set(weekday, []);
        });

        trends.forEach((trend) => {
            const day = new Date(`${trend.date}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'short',
            });

            const targetDay = weekdays.includes(day) ? day : 'Mon';
            grouped.get(targetDay)?.push(trend);
        });

        const rows = weekdays.map((weekday) => {
            const points = grouped.get(weekday) ?? [];
            const totalImpressions = points.reduce((sum, point) => sum + point.impressions, 0);
            const totalClicks = points.reduce((sum, point) => sum + point.clicks, 0);
            const totalCost = points.reduce((sum, point) => sum + point.cost, 0);
            const totalConversions = points.reduce((sum, point) => sum + point.conversions, 0);

            return {
                weekday,
                CTR: safeDivide(totalClicks, totalImpressions) * 100,
                CVR: safeDivide(totalConversions, totalClicks) * 100,
                CPC: safeDivide(totalCost, totalClicks),
                ROAS: safeDivide(totalCost * (summary?.averageRoas ?? 0), totalCost),
            };
        });

        const metricMax: Record<(typeof metricKeys)[number], number> = {
            CTR: Math.max(1, ...rows.map((row) => row.CTR)),
            CVR: Math.max(1, ...rows.map((row) => row.CVR)),
            CPC: Math.max(1, ...rows.map((row) => row.CPC)),
            ROAS: Math.max(1, ...rows.map((row) => row.ROAS)),
        };

        return rows.flatMap((row) =>
            metricKeys.map((metric) => ({
                weekday: row.weekday,
                metric,
                value: row[metric],
                intensity: row[metric] / metricMax[metric],
            }))
        );
    }, [trends, summary]);

    const runNaturalQuery = () => {
        const result = buildNaturalLanguageResult(queryInput, {
            derived,
            campaigns,
            period,
        });
        setQueryResult(result);
    };

    const sendChat = () => {
        const question = chatInput.trim();
        if (!question) return;

        const result = buildNaturalLanguageResult(question, {
            derived,
            campaigns,
            period,
        });

        const assistantMessage = `${result.answer}\n\nAction: ${recommendationItems[0]?.action ?? 'ยังไม่มีคำแนะนำเพิ่มเติม'}`;

        setChatMessages((prev) => [
            ...prev,
            { role: 'user', content: question },
            { role: 'assistant', content: assistantMessage },
        ]);

        setChatInput('');
    };

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">AI Insights</h1>
                            <p className="text-muted-foreground mt-1">
                                Intelligence Hub: Query, Insight, Alert, Recommendation และ Forecast ในหน้าเดียว
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
                            <TrendingUp className="size-4 text-primary" />
                            <h2 className="font-semibold">KPI Overview (Real-time)</h2>
                            <Badge variant="secondary">Auto-refresh 30s</Badge>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {kpiCards.map((card) => (
                                <Card key={card.label} className={KPI_CARD_STYLES[card.label] ?? ''}>
                                    <CardHeader className="pb-2">
                                        <CardDescription>{card.label}</CardDescription>
                                        <CardTitle className="text-xl">{isLoading ? 'Loading...' : card.value}</CardTitle>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-3">
                        <Card className="lg:col-span-2 border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary" />
                                    AI Summary
                                </CardTitle>
                                <CardDescription>
                                    สรุปสถานการณ์ธุรกิจอัตโนมัติจากข้อมูลล่าสุด
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-relaxed text-muted-foreground">{aiSummaryText}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Insight Generation</CardTitle>
                                <CardDescription>CTR / CPA / ROI / ROAS / Conversion Rate</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {insightItems.map((insight) => (
                                    <div key={insight.title} className="rounded-md border p-3">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-sm">{insight.title}</p>
                                            <Badge
                                                variant={
                                                    insight.level === 'critical'
                                                        ? 'destructive'
                                                        : insight.level === 'warning'
                                                          ? 'secondary'
                                                          : 'outline'
                                                }
                                            >
                                                {insight.level}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">{insight.detail}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <SearchCode className="size-4" />
                                    Natural Language Query
                                </CardTitle>
                                <CardDescription>
                                    พิมพ์ภาษาไทย เช่น "ยอดขายเดือนนี้จาก Shopee เป็นเท่าไร"
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Textarea
                                    value={queryInput}
                                    onChange={(event) => setQueryInput(event.target.value)}
                                    className="min-h-[84px]"
                                />
                                <Button onClick={runNaturalQuery} className="w-full">
                                    วิเคราะห์และสร้าง Query
                                </Button>

                                {queryResult && (
                                    <div className="space-y-2 rounded-md border p-3">
                                        <Badge variant="outline">{queryResult.queryType} Query</Badge>
                                        <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                                            {queryResult.generatedQuery}
                                        </pre>
                                        <Separator />
                                        <p className="text-sm">{queryResult.answer}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Anomaly Detection</CardTitle>
                                <CardDescription>
                                    แจ้งเตือนความผิดปกติ เช่น CPC สูงผิดปกติ หรือยอดลดเกิน 20%
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {anomalyItems.map((anomaly) => (
                                    <div
                                        key={anomaly.title}
                                        className="rounded-md border p-3 flex items-start gap-3"
                                    >
                                        <AlertTriangle
                                            className={`size-4 mt-0.5 ${
                                                anomaly.level === 'critical'
                                                    ? 'text-destructive'
                                                    : anomaly.level === 'warning'
                                                      ? 'text-amber-500'
                                                      : 'text-emerald-500'
                                            }`}
                                        />
                                        <div>
                                            <p className="font-medium text-sm">{anomaly.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{anomaly.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    <section>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Lightbulb className="size-4" />
                                    Recommendation Engine
                                </CardTitle>
                                <CardDescription>
                                    แนะนำกลยุทธ์ เช่น เพิ่มงบในกลุ่ม Remarketing หรือปรับ bid
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                                {recommendationItems.map((recommendation) => (
                                    <div key={recommendation.title} className="rounded-md border p-3">
                                        <p className="font-medium text-sm">{recommendation.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            เหตุผล: {recommendation.reason}
                                        </p>
                                        <p className="text-xs mt-2">แนะนำ: {recommendation.action}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">What-if Analysis</CardTitle>
                                <CardDescription>
                                    จำลองสถานการณ์ เช่น เพิ่มงบโฆษณา 15% แล้วกำไรจะเปลี่ยนเท่าไร
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span>Budget Adjustment</span>
                                        <Badge>{budgetAdjustment}%</Badge>
                                    </div>
                                    <Slider
                                        min={-30}
                                        max={40}
                                        step={1}
                                        value={[budgetAdjustment]}
                                        onValueChange={(value) => setBudgetAdjustment(value[0] ?? 0)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-md border p-3">
                                        <p className="text-muted-foreground text-xs">Projected Revenue</p>
                                        <p className="font-semibold mt-1">{formatCurrencyTHB(whatIf.projectedRevenue)}</p>
                                    </div>
                                    <div className="rounded-md border p-3">
                                        <p className="text-muted-foreground text-xs">Projected Cost</p>
                                        <p className="font-semibold mt-1">{formatCurrencyTHB(whatIf.projectedCost)}</p>
                                    </div>
                                    <div className="rounded-md border p-3">
                                        <p className="text-muted-foreground text-xs">Projected Profit</p>
                                        <p className="font-semibold mt-1">{formatCurrencyTHB(whatIf.projectedProfit)}</p>
                                    </div>
                                    <div className="rounded-md border p-3">
                                        <p className="text-muted-foreground text-xs">Projected ROI</p>
                                        <p className="font-semibold mt-1">{formatPercent(whatIf.projectedRoi)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Predictive Analytics (3 เดือน)</CardTitle>
                                <CardDescription>
                                    พยากรณ์ยอดขายจากแนวโน้มข้อมูลล่าสุด
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[280px]">
                                {forecastData.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลพอสำหรับพยากรณ์</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={forecastData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                                            <Tooltip formatter={(value: number) => formatCurrencyTHB(value)} />
                                            <Line
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#2563eb"
                                                strokeWidth={3}
                                                dot={{ r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    <section>
                        <div className="grid gap-4 xl:grid-cols-2">
                            <TrendChart data={trends} />

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Heatmap (Weekday x Metric)</CardTitle>
                                    <CardDescription>
                                        ความเข้มสีแทนความแรงของค่าแต่ละตัวชี้วัด
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-4 gap-2 text-xs mb-2 text-muted-foreground">
                                        <div>CTR</div>
                                        <div>CVR</div>
                                        <div>CPC</div>
                                        <div>ROAS</div>
                                    </div>
                                    <div className="space-y-2">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((weekday) => {
                                            const row = heatmapData.filter((cell) => cell.weekday === weekday);

                                            return (
                                                <div key={weekday} className="grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-2 items-center">
                                                    <span className="text-xs text-muted-foreground">{weekday}</span>
                                                    {row.map((cell) => (
                                                        <div
                                                            key={`${cell.weekday}-${cell.metric}`}
                                                            className="h-8 rounded text-[10px] font-medium flex items-center justify-center text-white"
                                                            style={{ backgroundColor: getHeatColor(cell.intensity) }}
                                                            title={`${cell.metric}: ${cell.value.toFixed(2)}`}
                                                        >
                                                            {cell.value.toFixed(1)}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Funnel Chart</CardTitle>
                                <CardDescription>Impressions to Clicks to Conversions</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[280px]">
                                {funnelData.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล funnel</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <FunnelChart>
                                            <Tooltip formatter={(value: number) => formatNumber(value)} />
                                            <Funnel
                                                dataKey="value"
                                                data={funnelData}
                                                isAnimationActive
                                            >
                                                {funnelData.map((entry) => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={
                                                            entry.name === 'Impressions'
                                                                ? '#60a5fa'
                                                                : entry.name === 'Clicks'
                                                                  ? '#f59e0b'
                                                                  : '#34d399'
                                                        }
                                                    />
                                                ))}
                                            </Funnel>
                                        </FunnelChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Campaign Ranking</CardTitle>
                                <CardDescription>Top campaign by estimated revenue</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[280px]">
                                {campaignRankingData.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลแคมเปญ</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={campaignRankingData} layout="vertical" margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                                            <YAxis type="category" dataKey="name" width={120} />
                                            <Tooltip formatter={(value: number) => formatCurrencyTHB(value)} />
                                            <Legend />
                                            <Bar dataKey="spending" name="Spending" fill="#f59e0b" radius={4} />
                                            <Bar dataKey="revenue" name="Estimated Revenue" fill="#3b82f6" radius={4} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    <section>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Bot className="size-4" />
                                    AI Assistant Chat
                                </CardTitle>
                                <CardDescription>
                                    ถามได้เช่น “โครงการไหนกำลังใช้ทรัพยากรเกินงบ?”
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="rounded-md border p-3 h-[220px] overflow-y-auto space-y-2">
                                    {chatMessages.map((message, index) => (
                                        <div
                                            key={`${message.role}-${index}`}
                                            className={`rounded-md px-3 py-2 text-sm whitespace-pre-wrap ${
                                                message.role === 'assistant'
                                                    ? 'bg-muted'
                                                    : 'bg-primary/10'
                                            }`}
                                        >
                                            <p className="font-medium text-xs mb-1">
                                                {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                                            </p>
                                            {message.content}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        value={chatInput}
                                        onChange={(event) => setChatInput(event.target.value)}
                                        placeholder="พิมพ์คำถาม..."
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                sendChat();
                                            }
                                        }}
                                    />
                                    <Button onClick={sendChat}>
                                        <Send className="size-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

