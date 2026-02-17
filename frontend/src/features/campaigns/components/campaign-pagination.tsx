// src/features/campaigns/components/campaign-pagination.tsx
// =============================================================================
// Campaign Pagination - Page Navigation Controls
// =============================================================================

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// =============================================================================
// Types
// =============================================================================

export interface CampaignPaginationProps {
    /** Current page number (1-indexed) */
    currentPage: number;
    /** Total number of pages */
    totalPages: number;
    /** Total number of items */
    totalItems?: number;
    /** Items per page */
    itemsPerPage?: number;
    /** Callback when page changes */
    onPageChange: (page: number) => void;
    /** Optional: Disable controls */
    disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function CampaignPagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage = 10,
    onPageChange,
    disabled = false,
}: CampaignPaginationProps) {
    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    const handlePrevious = () => {
        if (canGoPrevious) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (canGoNext) {
            onPageChange(currentPage + 1);
        }
    };

    // Calculate item range
    const startItem = totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

    // Don't render if no pages
    if (totalPages <= 0) {
        return null;
    }

    return (
        <div className="flex items-center justify-between px-2 py-4">
            {/* Item count info */}
            <div className="text-sm text-muted-foreground">
                {totalItems ? (
                    <span>
                        Showing <span className="font-medium">{startItem}</span> to{' '}
                        <span className="font-medium">{endItem}</span> of{' '}
                        <span className="font-medium">{totalItems}</span> campaigns
                    </span>
                ) : (
                    <span>
                        Page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                    </span>
                )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={!canGoPrevious || disabled}
                    className="gap-1"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={!canGoNext || disabled}
                    className="gap-1"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default CampaignPagination;
