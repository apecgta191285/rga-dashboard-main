import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface DashboardAISummaryProps {
    overview: any;
}

export const DashboardAISummary = ({ overview }: DashboardAISummaryProps) => {
    // Simple rule-based logic for "AI" summary
    const generateSummary = () => {
        if (!overview?.current) return "Gathering data to generate insights...";

        const { spend, conversions, clicks } = overview.current || { spend: 0, conversions: 0, clicks: 0 };
        const trends = overview.trends || {};

        const insights = [];

        const spendTrend = Number(trends?.spend ?? 0);
        if (spendTrend > 10) {
            insights.push(`Ad spend has increased by ${spendTrend.toFixed(1)}%. Monitor ROI closely.`);
        } else if (spendTrend < -10) {
            insights.push(`Ad spend is down by ${Math.abs(spendTrend).toFixed(1)}%. Check if campaigns are capped.`);
        }

        const convTrend = Number(trends?.conversions ?? 0);
        if (convTrend > 0) {
            insights.push(`Great job! Conversions are up by ${convTrend.toFixed(1)}%.`);
        }

        if (Number(clicks ?? 0) > 1000 && Number(conversions ?? 0) === 0) {
            insights.push("High traffic but no conversions. Consider optimizing your landing page.");
        }

        if (insights.length === 0) {
            insights.push("Performance is stable. No critical anomalies detected.");
        }

        return insights.join(" ");
    };

    return (
        <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Sparkles className="w-5 h-5 text-primary mr-2" />
                <CardTitle className="text-lg font-medium text-primary">AI Insight Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {generateSummary()}
                </p>
            </CardContent>
        </Card>
    );
};
