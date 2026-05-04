import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Target, Timer, Trophy, Users, Eye, Activity, MousePointerClick } from "lucide-react";
import { SeoMetricSummary } from "../types";

interface SeoSummaryCardsProps {
    data: SeoMetricSummary;
    isLoading?: boolean;
}

export function SeoSummaryCards({ data, isLoading }: SeoSummaryCardsProps) {
    const metrics = [
        {
            title: "Organic Sessions",
            value: data.organicSessions.toLocaleString(),
            icon: Users,
            trend: `${data.organicSessionsTrend && data.organicSessionsTrend > 0 ? '+' : ''}${data.organicSessionsTrend ?? 0}%`,
            trendUp: (data.organicSessionsTrend ?? 0) >= 0,
            description: "Total organic traffic sessions",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            title: "Goal Completions",
            value: data.goalCompletions !== null ? data.goalCompletions.toLocaleString() : "-",
            icon: Target,
            trend: `${data.goalCompletionsTrend && data.goalCompletionsTrend > 0 ? '+' : ''}${data.goalCompletionsTrend ?? 0}%`,
            trendUp: (data.goalCompletionsTrend ?? 0) >= 0,
            description: "Completed conversion goals",
            color: "text-green-500",
            bg: "bg-green-50"
        },
        {
            title: "Avg. Position",
            value: data.avgPosition !== null ? data.avgPosition.toFixed(1) : "-",
            icon: Trophy,
            trend: `${data.avgPositionTrend && data.avgPositionTrend > 0 ? '+' : ''}${data.avgPositionTrend ?? 0}%`,
            trendUp: (data.avgPositionTrend ?? 0) <= 0, // Lower position is better, so negative trend is good
            description: "Average search ranking position",
            color: "text-amber-500",
            bg: "bg-amber-50"
        },
        {
            title: "Avg. Time on Page",
            value: formatDuration(data.avgTimeOnPage),
            icon: Timer,
            trend: `${data.avgTimeOnPageTrend && data.avgTimeOnPageTrend > 0 ? '+' : ''}${data.avgTimeOnPageTrend ?? 0}%`,
            trendUp: (data.avgTimeOnPageTrend ?? 0) >= 0,
            description: "Average session duration",
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            title: "Active Users",
            value: data.activeUsers !== undefined ? data.activeUsers.toLocaleString() : "-",
            icon: Users,
            trend: `${data.activeUsersTrend && data.activeUsersTrend > 0 ? '+' : ''}${data.activeUsersTrend ?? 0}%`,
            trendUp: (data.activeUsersTrend ?? 0) >= 0,
            description: "Total active users",
            color: "text-indigo-500",
            bg: "bg-indigo-50"
        },
        {
            title: "Page Views",
            value: data.screenPageViews !== undefined ? data.screenPageViews.toLocaleString() : "-",
            icon: Eye,
            trend: `${data.screenPageViewsTrend && data.screenPageViewsTrend > 0 ? '+' : ''}${data.screenPageViewsTrend ?? 0}%`,
            trendUp: (data.screenPageViewsTrend ?? 0) >= 0,
            description: "Total screen page views",
            color: "text-sky-500",
            bg: "bg-sky-50"
        },
        {
            title: "Engagement Rate",
            value: data.engagementRate !== undefined ? `${data.engagementRate}%` : "-",
            icon: Activity,
            trend: `${data.engagementRateTrend && data.engagementRateTrend > 0 ? '+' : ''}${data.engagementRateTrend ?? 0}%`,
            trendUp: (data.engagementRateTrend ?? 0) >= 0,
            description: "Percentage of engaged sessions",
            color: "text-emerald-500",
            bg: "bg-emerald-50"
        },
        {
            title: "Bounce Rate",
            value: data.bounceRate !== undefined ? `${data.bounceRate}%` : "-",
            icon: MousePointerClick,
            trend: `${data.bounceRateTrend && data.bounceRateTrend > 0 ? '+' : ''}${data.bounceRateTrend ?? 0}%`,
            trendUp: (data.bounceRateTrend ?? 0) <= 0, // Lower is better
            description: "Percentage of single-page sessions",
            color: "text-rose-500",
            bg: "bg-rose-50"
        }
    ];

    if (isLoading) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="animate-pulse">
                    <CardContent className="p-6 h-32" />
                </Card>
            ))}
        </div>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
                <Card key={metric.title} className="hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                {metric.title}
                            </p>
                            <div className={`p-2 rounded-full ${metric.bg}`}>
                                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                            </div>
                        </div>
                        <div className="flex items-baseline justify-between pt-2">
                            <div className="text-2xl font-bold">{metric.value}</div>
                            <div className={`flex items-center text-xs ${metric.trendUp ? 'text-green-600' : 'text-red-600'} bg-opacity-10 px-2 py-1 rounded-full ${metric.trendUp ? 'bg-green-50' : 'bg-red-50'}`}>
                                {metric.trendUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {metric.trend}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {metric.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
}
