import { ConversionResult } from './types';
import { CONVERSION_FACTORS } from './constants';
import { convertWithAI } from './ai-converter';

/**
 * Round a number for display purposes
 * - Integers stay as integers
 * - Decimals: up to 2 decimal places, removing trailing zeros
 */
export function roundForDisplay(value: number): number {
  if (Number.isInteger(value)) {
    return value;
  }
  // Round to 2 decimal places
  const rounded = Math.round(value * 100) / 100;
  return rounded;
}

/**
 * Format a converted amount for display
 */
export function formatConvertedAmount(amount: number): string {
  if (Number.isInteger(amount)) {
    return amount.toString();
  }
  // Remove trailing zeros but keep meaningful decimals
  return amount.toFixed(2).replace(/\.?0+$/, '').replace(/\.$/, '');
}

/**
 * Convert between units using lookup table or AI fallback
 */
export async function convertUnit(
  amount: number,
  fromUnit: string,
  toUnit: string,
  ingredientName: string
): Promise<ConversionResult> {
  // Same unit - no conversion needed
  if (fromUnit === toUnit) {
    return {
      amount: roundForDisplay(amount),
      unit: toUnit,
      isEstimated: false,
    };
  }

  // Check if both units have conversion factors (same category conversion)
  const fromFactor = CONVERSION_FACTORS[fromUnit];
  const toFactor = CONVERSION_FACTORS[toUnit];

  if (fromFactor && toFactor) {
    // Both units are in the lookup table - direct conversion
    const baseAmount = amount * fromFactor;
    const convertedAmount = baseAmount / toFactor;

    return {
      amount: roundForDisplay(convertedAmount),
      unit: toUnit,
      isEstimated: false,
    };
  }

  // Cross-category conversion or unknown units - use AI
  return convertWithAI(amount, fromUnit, toUnit, ingredientName);
}

/**
 * Check if a conversion can be done via lookup table (no AI needed)
 */
export function canConvertViaLookup(fromUnit: string, toUnit: string): boolean {
  if (fromUnit === toUnit) return true;

  const fromFactor = CONVERSION_FACTORS[fromUnit];
  const toFactor = CONVERSION_FACTORS[toUnit];

  // Both units must exist in the conversion table
  return !!(fromFactor && toFactor);
}

/**
 * Get the conversion preview (for UI display before applying)
 * Returns null if AI conversion is needed (async)
 */
function getConversionPreview(
  amount: number,
  fromUnit: string,
  toUnit: string
): ConversionResult | null {
  if (fromUnit === toUnit) {
    return {
      amount: roundForDisplay(amount),
      unit: toUnit,
      isEstimated: false,
    };
  }

  const fromFactor = CONVERSION_FACTORS[fromUnit];
  const toFactor = CONVERSION_FACTORS[toUnit];

  if (fromFactor && toFactor) {
    const baseAmount = amount * fromFactor;
    const convertedAmount = baseAmount / toFactor;

    return {
      amount: roundForDisplay(convertedAmount),
      unit: toUnit,
      isEstimated: false,
    };
  }

  // AI conversion needed - return null (caller should handle async)
  return null;
}
