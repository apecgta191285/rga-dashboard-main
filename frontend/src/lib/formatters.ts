export const toNumber = (v: any, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

export const formatCurrency = (value: number | string, currency: string = 'USD'): string => {
    const n = toNumber(value, 0);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
};

/**
 * Format currency as Thai Baht (THB)
 */
export const formatCurrencyTHB = (value: number | string): string => {
    const n = toNumber(value, 0);
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
};

export const formatNumber = (value: number | string): string => {
    const n = toNumber(value, 0);
    return new Intl.NumberFormat('en-US').format(n);
};

export const formatCompactNumber = (value: number | string): string => {
    const n = toNumber(value, 0);
    return new Intl.NumberFormat('en-US', {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1,
    }).format(n);
};

/**
 * Format percentage with 1 decimal place
 */
export const formatPercentage = (value: number): string => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
};

export const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Format currency as Thai Baht with 2 decimal places
 */
export const formatCurrencyTHBDecimal = (value: number | string): string => {
    const n = toNumber(value, 0);
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
};

/**
 * Format currency in compact notation (e.g., $1.2M)
 */
export const formatCompactCurrency = (value: number | string, currency = 'USD'): string => {
    const n = toNumber(value, 0);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: 2,
    }).format(n);
};

/**
 * Format currency with full amount (no decimals)
 */
export const formatCurrencyFull = (value: number | string, currency = 'USD'): string => {
    const n = toNumber(value, 0);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(n);
};

