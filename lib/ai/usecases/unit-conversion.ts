import { defineUseCase } from './index';

export type UnitConversionInput = {
  amount: number;
  fromUnit: string;
  toUnit: string;
  ingredientName: string;
  fromCategory?: string;
  toCategory?: string;
};

export type UnitConversionOutput = {
  amount: number;
  unit: string;
  isEstimated: boolean;
  note?: string;
};

/**
 * AI use case for converting between units, especially for cross-category conversions
 * (e.g., weight to volume) that require ingredient-specific density knowledge.
 *
 * Cost tier: cheap - This is a simple, well-defined task that works well with smaller models
 */
export const unitConversionUseCase = defineUseCase<
  UnitConversionInput,
  UnitConversionOutput
>({
  id: 'unit-conversion',
  description: 'Convert between different units of measurement for ingredients',
  costTier: 'cheap',

  systemPrompt: `You are a precise unit conversion assistant for cooking and baking.

Your task is to convert ingredient amounts between different units accurately.

Rules:
1. For same-category conversions (e.g., cups to tablespoons), use standard conversion factors
2. For cross-category conversions (weight to volume or vice versa), consider the ingredient's typical density
3. Return results rounded to 2 decimal places maximum
4. If the conversion is approximate or estimated, indicate this clearly
5. If you cannot perform the conversion accurately, state this explicitly

Respond ONLY with a JSON object in this exact format:
{
  "amount": number,
  "unit": "string",
  "isEstimated": boolean,
  "note": "string (optional - explain if estimated or if there are caveats)"
}`,

  buildMessages: (input) => {
    const { amount, fromUnit, toUnit, ingredientName, fromCategory, toCategory } =
      input;

    let userMessage = `Convert ${amount} ${fromUnit} of "${ingredientName}" to ${toUnit}.`;

    if (fromCategory && toCategory && fromCategory !== toCategory) {
      userMessage += ` This is a cross-category conversion from ${fromCategory} to ${toCategory}.`;
    }

    return [{ role: 'user', content: userMessage }];
  },

  parseResponse: (result) => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(result.content.trim());

      return {
        amount: Number(parsed.amount),
        unit: String(parsed.unit),
        isEstimated: Boolean(parsed.isEstimated),
        note: parsed.note ? String(parsed.note) : undefined,
      };
    } catch {
      // Fallback: try to extract a number from the response
      const numberMatch = result.content.match(/(\d+\.?\d*)/);
      const amount = numberMatch ? parseFloat(numberMatch[1]) : 0;

      return {
        amount,
        unit: '', // Caller should use original target unit
        isEstimated: true,
        note: 'Failed to parse structured response',
      };
    }
  },

  temperature: 0.1, // Low temperature for consistent, deterministic conversions
  maxTokens: 150,
});

/**
 * Convenience function for unit conversion
 */
export async function convertUnitsWithAI(
  input: UnitConversionInput
): Promise<UnitConversionOutput> {
  const { executeUseCase } = await import('./index');
  const result = await executeUseCase(unitConversionUseCase, input);

  if (!result.success) {
    return {
      amount: input.amount,
      unit: input.toUnit,
      isEstimated: true,
      note: `Conversion failed: ${result.error}`,
    };
  }

  return result.data;
}
