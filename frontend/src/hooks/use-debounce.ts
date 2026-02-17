// src/hooks/use-debounce.ts
// =============================================================================
// Debounce Hook - Delays value updates for performance optimization
// =============================================================================

import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value.
 * Useful for delaying API calls while user is typing.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 *
 * // debouncedSearch only updates 500ms after user stops typing
 * useEffect(() => {
 *     fetchData(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up timer to update debounced value after delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up timer on value change or unmount
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default useDebounce;
