// src/features/dashboard/components/widgets/recent-campaigns.tsx
// =============================================================================
// Recent Campaigns Widget - Displays Top Campaigns with Platform & Spend
// =============================================================================

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrencyTHB } from '@/lib/formatters';
import { BrandLogo } from '@/components/ui/brand-logo';
import { HelpCircle, Info } from 'lucide-react';
import {
    Tooltip as UiTooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import type { RecentCampaign, CampaignStatus, AdPlatform } from '../../schemas';

// =============================================================================
// Status Badge Styling
// =============================================================================

const STATUS_STYLES: Record<
    CampaignStatus,
    {
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        label: string;
    }
> = {
    ACTIVE: { variant: 'default', label: 'Active' },
    PAUSED: { variant: 'secondary', label: 'Paused' },
    PENDING: { variant: 'outline', label: 'Pending' },
    COMPLETED: { variant: 'outline', label: 'Completed' },
    ENDED: { variant: 'secondary', label: 'Ended' },
    DELETED: { variant: 'destructive', label: 'Deleted' },
};

// =============================================================================
// Platform Display Names
// =============================================================================

const PLATFORM_NAMES: Record<AdPlatform, string> = {
    GOOGLE_ADS: 'Google Ads',
    FACEBOOK: 'Facebook',
    INSTAGRAM: 'Instagram',
    TIKTOK: 'TikTok',
    LINE_ADS: 'LINE Ads',
    GOOGLE_ANALYTICS: 'Analytics',
    SHOPEE: 'Shopee',
    LAZADA: 'Lazada',
};

// =============================================================================
// Props Interface
// =============================================================================

interface RecentCampaignsProps {
    /** Array of recent campaigns from API */
    campaigns: RecentCampaign[];
    /** Optional class name */
    className?: string;
}

// =============================================================================
// Info Tooltip Component
// =============================================================================

function RecentCampaignsInfoTooltip() {
    return (
        <TooltipProvider>
            <UiTooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Info className="h-4 w-4" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-sm leading-relaxed">
                    <p className="font-semibold mb-1">Recent Campaigns</p>
                    <p>
                        This section displays the latest campaigns within the selected period.
                        It helps monitor campaign status, advertising platform, spending amount,
                        and budget utilization so you can quickly review active performance.
                    </p>
                </TooltipContent>
            </UiTooltip>
        </TooltipProvider>
    );
}

// =============================================================================
// Main Component
// =============================================================================

export function RecentCampaigns({
    campaigns,
    className
}: RecentCampaignsProps) {
    const hasData = campaigns && campaigns.length > 0;

    return (
        <Card className={`h-[400px] flex flex-col ${className ?? ''}`}>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">
                        Recent Campaigns
                    </CardTitle>
                    <RecentCampaignsInfoTooltip />
                </div>

                <CardDescription>
                    {hasData
                        ? `${campaigns.length} campaign${
                              campaigns.length > 1 ? 's' : ''
                          } in selected period`
                        : 'No campaigns found'}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 min-h-0">
                {!hasData ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        <p className="text-sm">No campaign data available</p>
                    </div>
                ) : (
                    <ScrollArea className="h-full pr-4">
                        <div className="space-y-4">
                            {campaigns.map((campaign) => {
                                const statusStyle =
                                    STATUS_STYLES[campaign.status] ||
                                    STATUS_STYLES.PENDING;

                                const platformName =
                                    PLATFORM_NAMES[campaign.platform] ||
                                    campaign.platform;

                                return (
                                    <div
                                        key={campaign.id}
                                        className="flex w-full h-16 items-center gap-3 rounded-lg border p-3 transition-all duration-200 hover:bg-muted/50 hover:shadow-sm"
                                    >
                                        {/* Left: Platform Icon */}
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border border-border shadow-sm">
                                            <BrandLogo
                                                platformId={campaign.platform}
                                                className="h-6 w-6"
                                            />

                                            {/* Fallback if BrandLogo returns null */}
                                            {!BrandLogo({
                                                platformId: campaign.platform,
                                                className: 'h-6 w-6',
                                            }) && (
                                                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>

                                        {/* Center-Left: Campaign Info */}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium leading-tight">
                                                {campaign.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground leading-tight">
                                                {platformName}
                                            </p>
                                        </div>

                                        {/* Center-Right: Status Badge */}
                                        <Badge
                                            variant={statusStyle.variant}
                                            className="text-xs shrink-0"
                                        >
                                            {statusStyle.label}
                                        </Badge>

                                        {/* Right: Spending Info */}
                                        <div className="text-right shrink-0 w-16">
                                            <p className="text-sm font-medium leading-tight">
                                                {formatCurrencyTHB(
                                                    campaign.spending
                                                )}
                                            </p>

                                            {campaign.budgetUtilization !==
                                                undefined && (
                                                <p className="text-xs text-muted-foreground leading-tight">
                                                    {campaign.budgetUtilization.toFixed(
                                                        0
                                                    )}
                                                    % used
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}

export default RecentCampaigns;