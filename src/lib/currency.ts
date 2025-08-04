

const DEFAULT_CURRENCY = 'XOF'; // CFA Franc
const DEFAULT_LOCALE = 'fr-CI'; // Côte d'Ivoire

// This map helps to show symbols for common currencies.
// For others, it will just show the currency code (e.g., "1,000 NGN").
const CURRENCY_DISPLAY_MAP: Record<string, 'symbol' | 'code'> = {
    'XOF': 'code',
    'EUR': 'symbol',
    'USD': 'symbol',
    'GBP': 'symbol',
    'JPY': 'symbol',
    'NGN': 'code', // Nigerian Naira example
};

/**
 * Formats a number as a currency string based on the provided currency code.
 * @param amount The number to format.
 * @param currencyCode The ISO 4217 currency code (e.g., 'XOF', 'EUR', 'USD').
 * @returns A formatted currency string.
 */
export function formatCurrency(amount: number | undefined | null, currencyCode?: string | null): string {
    if (amount === undefined || amount === null) {
        amount = 0;
    }

    const code = currencyCode || DEFAULT_CURRENCY;
    
    // Using a generic 'fr' locale as a base for number formatting (e.g., using spaces as thousand separators).
    // The specific currency symbol/code will be determined by the `currency` option.
    const locale = 'fr'; 

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: code,
            currencyDisplay: CURRENCY_DISPLAY_MAP[code] || 'code',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch (error) {
        console.warn(`Could not format currency for code: ${code}. Falling back to default.`, error);
        // Fallback for invalid currency codes
        return `${amount.toLocaleString(DEFAULT_LOCALE)} ${code}`;
    }
}
