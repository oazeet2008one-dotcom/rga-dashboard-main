export const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

/**
 * Format currency as Thai Baht (THB)
 */
export const formatCurrencyTHB = (value: number): string => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
};

export const formatCompactNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1,
    }).format(value);
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

