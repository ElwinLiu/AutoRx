import { ConversionResult } from './types';
import { getUnitCategory } from './constants';
import { convertUnitsWithAI } from '@/lib/ai/usecases/unit-conversion';

/**
 * Round a number for display purposes
 * - Integers stay as integers
 * - Decimals: up to 2 decimal places, removing trailing zeros
 */
function roundForDisplay(value: number): number {
  if (Number.isInteger(value)) {
    return value;
  }
  // Round to 2 decimal places
  const rounded = Math.round(value * 100) / 100;
  return rounded;
}

/**
 * Call AI to perform cross-category or complex conversions
 * Uses the AI use case layer for structured, cost-effective conversions
 */
export async function convertWithAI(
  amount: number,
  fromUnit: string,
  toUnit: string,
  ingredientName: string
): Promise<ConversionResult> {
  const fromCategory = getUnitCategory(fromUnit);
  const toCategory = getUnitCategory(toUnit);

  try {
    const result = await convertUnitsWithAI({
      amount,
      fromUnit,
      toUnit,
      ingredientName,
      fromCategory,
      toCategory,
    });

    return {
      amount: roundForDisplay(result.amount),
      unit: result.unit || toUnit,
      isEstimated: result.isEstimated,
      note: result.note,
    };
  } catch (error) {
    console.error('AI conversion error:', error);
    // Fallback to estimation
    const estimatedAmount = estimateConversion(amount, fromUnit, toUnit, ingredientName);

    return {
      amount: roundForDisplay(estimatedAmount),
      unit: toUnit,
      isEstimated: true,
      note: 'AI unavailable, using estimated conversion',
    };
  }
}

/**
 * Estimate conversion based on typical values
 * This is a fallback when AI is not available
 */
function estimateConversion(
  amount: number,
  fromUnit: string,
  toUnit: string,
  ingredientName: string
): number {
  const fromCategory = getUnitCategory(fromUnit);
  const toCategory = getUnitCategory(toUnit);

  // Common density approximations (g/ml) for cross-category conversions
  const typicalDensities: Record<string, number> = {
    // Liquids
    'water': 1.0,
    'oil': 0.92,
    'soy sauce': 1.2,
    'vinegar': 1.01,
    'wine': 0.99,
    'milk': 1.03,
    'honey': 1.42,
    'syrup': 1.33,

    // Dry goods
    'rice': 0.85,
    'flour': 0.59,
    'sugar': 0.85,
    'salt': 1.2,
    'brown sugar': 0.93,

    // Proteins
    'chicken': 1.06,
    'beef': 1.05,
    'pork': 1.05,
    'fish': 1.0,
    'shrimp': 1.0,

    // Vegetables
    'onion': 0.6,
    'garlic': 0.65,
    'ginger': 0.75,
    'carrot': 0.65,
    'potato': 0.67,
    'tomato': 0.6,

    // Default
    'default': 1.0,
  };

  // Find matching density
  const ingredientLower = ingredientName.toLowerCase();
  let density = typicalDensities.default;

  for (const [key, value] of Object.entries(typicalDensities)) {
    if (ingredientLower.includes(key)) {
      density = value;
      break;
    }
  }

  // Cross-category conversions
  if (fromCategory === 'weight' && toCategory === 'volume') {
    // g to ml (using density)
    if (fromUnit === 'g' && toUnit === 'ml') {
      return amount / density;
    }
    if (fromUnit === 'g' && toUnit === 'tsp') {
      return (amount / density) / 4.92892;
    }
    if (fromUnit === 'g' && toUnit === 'tbsp') {
      return (amount / density) / 14.7868;
    }
    if (fromUnit === 'g' && toUnit === 'cup') {
      return (amount / density) / 236.588;
    }
  }

  if (fromCategory === 'volume' && toCategory === 'weight') {
    // ml to g (using density)
    if (fromUnit === 'ml' && toUnit === 'g') {
      return amount * density;
    }
    if (fromUnit === 'tsp' && toUnit === 'g') {
      return amount * 4.92892 * density;
    }
    if (fromUnit === 'tbsp' && toUnit === 'g') {
      return amount * 14.7868 * density;
    }
    if (fromUnit === 'cup' && toUnit === 'g') {
      return amount * 236.588 * density;
    }
  }

  // Count conversions (rough estimates)
  if (toCategory === 'count') {
    const typicalWeights: Record<string, number> = {
      'clove': 5,      // garlic clove ~5g
      'piece': 100,    // generic piece ~100g
      'slice': 20,     // slice ~20g
      'bunch': 150,    // bunch ~150g
    };

    if (fromCategory === 'weight' && fromUnit === 'g') {
      const weightPerUnit = typicalWeights[toUnit] || 50;
      return amount / weightPerUnit;
    }
  }

  if (fromCategory === 'count') {
    const typicalWeights: Record<string, number> = {
      'clove': 5,
      'piece': 100,
      'slice': 20,
      'bunch': 150,
    };

    if (toCategory === 'weight' && toUnit === 'g') {
      const weightPerUnit = typicalWeights[fromUnit] || 50;
      return amount * weightPerUnit;
    }
  }

  // Fallback: return original amount
  return amount;
}

/**
 * Check if AI conversion is needed
 */
function needsAIConversion(fromUnit: string, toUnit: string): boolean {
  const { CONVERSION_FACTORS } = require('./constants');

  if (fromUnit === toUnit) return false;

  const fromFactor = CONVERSION_FACTORS[fromUnit];
  const toFactor = CONVERSION_FACTORS[toUnit];

  // If both units are in the lookup table, no AI needed
  return !(fromFactor && toFactor);
}
