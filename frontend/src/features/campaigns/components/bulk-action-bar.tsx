// src/features/campaigns/components/bulk-action-bar.tsx
// =============================================================================
// Bulk Action Bar - Displays actions for selected campaigns
// =============================================================================

import { X, Pause, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// =============================================================================
// Types
// =============================================================================

export interface BulkActionBarProps {
    /** Number of selected items */
    selectedCount: number;
    /** Clear all selections */
    onClearSelection: () => void;
    /** Pause selected campaigns (optional - visual only for now) */
    onPause?: () => void;
    /** Enable selected campaigns (optional - visual only for now) */
    onEnable?: () => void;
    /** Delete selected campaigns (optional - visual only for now) */
    onDelete?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function BulkActionBar({
    selectedCount,
    onClearSelection,
    onPause,
    onEnable,
    onDelete,
}: BulkActionBarProps) {
    if (selectedCount === 0) {
        return null;
    }

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-lg border bg-muted/50 p-3">
            {/* Selection Info */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onClearSelection}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear selection</span>
                </Button>
                <span className="text-sm font-medium">
                    {selectedCount} campaign{selectedCount > 1 ? 's' : ''} selected
                </span>
            </div>

            {/* Bulk Actions - Wrap on mobile */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onPause}
                    className="gap-2"
                >
                    <Pause className="h-4 w-4" />
                    <span className="hidden xs:inline">Pause</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onEnable}
                    className="gap-2"
                >
                    <Play className="h-4 w-4" />
                    <span className="hidden xs:inline">Enable</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    className="gap-2 text-destructive hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden xs:inline">Delete</span>
                </Button>
            </div>
        </div>
    );
}

export default BulkActionBar;
