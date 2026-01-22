// src/features/campaigns/components/campaigns-table.tsx
// =============================================================================
// Campaigns Table - Sortable Headers & Row Selection
// =============================================================================

import { Link } from 'wouter';
import { format } from 'date-fns';
import {
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Pause,
    Play,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { Campaign, STATUS_STYLES, PLATFORM_LABELS } from '../types';

// =============================================================================
// Types
// =============================================================================

export type SortableColumn = 'name' | 'status' | 'platform' | 'spend' | 'impressions' | 'clicks' | 'createdAt';

export interface CampaignsTableProps {
    campaigns: Campaign[];
    isLoading?: boolean;
    // Sorting
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (column: SortableColumn) => void;
    // Selection
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onToggleAll: (isChecked: boolean) => void;
    // Actions
    onView?: (campaign: Campaign) => void;
    onEdit?: (campaign: Campaign) => void;
    onDelete?: (campaign: Campaign) => void;
    onToggleStatus?: (campaign: Campaign) => void;
}

// =============================================================================
// Formatters
// =============================================================================

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('th-TH').format(num);
};

const formatDate = (dateString: string): string => {
    try {
        return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
        return '-';
    }
};

const calculateCTR = (clicks: number, impressions: number): string => {
    if (impressions === 0) return '0%';
    return ((clicks / impressions) * 100).toFixed(2) + '%';
};

// =============================================================================
// Sortable Header Component
// =============================================================================

interface SortableHeaderProps {
    column: SortableColumn;
    label: string;
    currentSortBy: string;
    currentSortOrder: 'asc' | 'desc';
    onSort: (column: SortableColumn) => void;
    align?: 'left' | 'right';
}

function SortableHeader({
    column,
    label,
    currentSortBy,
    currentSortOrder,
    onSort,
    align = 'left',
}: SortableHeaderProps) {
    const isActive = currentSortBy === column;

    const SortIcon = isActive
        ? currentSortOrder === 'asc'
            ? ArrowUp
            : ArrowDown
        : ArrowUpDown;

    return (
        <Button
            variant="ghost"
            size="sm"
            className={`-ml-3 h-8 flex items-center gap-1 hover:bg-muted/50 ${align === 'right' ? 'justify-end' : ''
                }`}
            onClick={() => onSort(column)}
        >
            {label}
            <SortIcon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        </Button>
    );
}

// =============================================================================
// Main Component
// =============================================================================

export function CampaignsTable({
    campaigns,
    isLoading = false,
    sortBy,
    sortOrder,
    onSort,
    selectedIds,
    onToggleSelect,
    onToggleAll,
    onView,
    onEdit,
    onDelete,
    onToggleStatus,
}: CampaignsTableProps) {
    // Check if all items on this page are selected
    const allSelected = campaigns.length > 0 && campaigns.every((c) => selectedIds.has(c.id));
    const someSelected = campaigns.some((c) => selectedIds.has(c.id)) && !allSelected;

    // Empty state
    if (campaigns.length === 0 && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
                <div className="rounded-full bg-muted p-4 mb-4">
                    <svg
                        className="h-8 w-8 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">No campaigns found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filters or create a new campaign.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {/* Selection Checkbox */}
                        <TableHead className="w-[50px]">
                            <Switch
                                checked={allSelected}
                                onCheckedChange={(checked) => onToggleAll(!!checked)}
                                aria-label="Select all campaigns"
                            />
                        </TableHead>

                        {/* Campaign Name - Sortable */}
                        <TableHead className="w-[250px]">
                            <SortableHeader
                                column="name"
                                label="Campaign"
                                currentSortBy={sortBy}
                                currentSortOrder={sortOrder}
                                onSort={onSort}
                            />
                        </TableHead>

                        {/* Status - Sortable */}
                        <TableHead>
                            <SortableHeader
                                column="status"
                                label="Status"
                                currentSortBy={sortBy}
                                currentSortOrder={sortOrder}
                                onSort={onSort}
                            />
                        </TableHead>

                        {/* Platform */}
                        <TableHead>
                            <SortableHeader
                                column="platform"
                                label="Platform"
                                currentSortBy={sortBy}
                                currentSortOrder={sortOrder}
                                onSort={onSort}
                            />
                        </TableHead>

                        {/* Spend - Sortable */}
                        <TableHead className="text-right">
                            <SortableHeader
                                column="spend"
                                label="Spent"
                                currentSortBy={sortBy}
                                currentSortOrder={sortOrder}
                                onSort={onSort}
                                align="right"
                            />
                        </TableHead>

                        {/* Impressions - Sortable */}
                        <TableHead className="text-right">
                            <SortableHeader
                                column="impressions"
                                label="Impressions"
                                currentSortBy={sortBy}
                                currentSortOrder={sortOrder}
                                onSort={onSort}
                                align="right"
                            />
                        </TableHead>

                        {/* Clicks - Sortable */}
                        <TableHead className="text-right">
                            <SortableHeader
                                column="clicks"
                                label="Clicks"
                                currentSortBy={sortBy}
                                currentSortOrder={sortOrder}
                                onSort={onSort}
                                align="right"
                            />
                        </TableHead>

                        {/* CTR (Calculated, not sortable server-side) */}
                        <TableHead className="text-right">CTR</TableHead>

                        {/* Actions */}
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {campaigns.map((campaign) => {
                        const isSelected = selectedIds.has(campaign.id);

                        return (
                            <TableRow
                                key={campaign.id}
                                className={isSelected ? 'bg-muted/50' : undefined}
                            >
                                {/* Selection Checkbox */}
                                <TableCell>
                                    <Switch
                                        checked={isSelected}
                                        onCheckedChange={() => onToggleSelect(campaign.id)}
                                        aria-label={`Select ${campaign.name}`}
                                    />
                                </TableCell>

                                {/* Campaign Name - Clickable Link */}
                                <TableCell>
                                    <Link href={`/campaigns/${campaign.id}`}>
                                        <span className="font-medium hover:underline text-primary cursor-pointer">
                                            {campaign.name}
                                        </span>
                                    </Link>
                                </TableCell>

                                {/* Status Badge */}
                                <TableCell>
                                    <Badge
                                        variant="secondary"
                                        className={STATUS_STYLES[campaign.status]}
                                    >
                                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                    </Badge>
                                </TableCell>

                                {/* Platform */}
                                <TableCell className="text-muted-foreground">
                                    {PLATFORM_LABELS[campaign.platform]}
                                </TableCell>

                                {/* Spent */}
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(campaign.spent)}
                                </TableCell>

                                {/* Impressions */}
                                <TableCell className="text-right">
                                    {formatNumber(campaign.impressions)}
                                </TableCell>

                                {/* Clicks */}
                                <TableCell className="text-right">
                                    {formatNumber(campaign.clicks)}
                                </TableCell>

                                {/* CTR */}
                                <TableCell className="text-right">
                                    {calculateCTR(campaign.clicks, campaign.impressions)}
                                </TableCell>

                                {/* Actions Dropdown */}
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Open menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onView?.(campaign)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onEdit?.(campaign)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Campaign
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onToggleStatus?.(campaign)}>
                                                {campaign.status === 'active' ? (
                                                    <>
                                                        <Pause className="mr-2 h-4 w-4" />
                                                        Pause Campaign
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="mr-2 h-4 w-4" />
                                                        Activate Campaign
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => onDelete?.(campaign)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Campaign
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

export default CampaignsTable;
