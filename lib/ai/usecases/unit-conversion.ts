import { MODEL_ROLES } from '../constants';
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
 * Uses the secondary model for cost-effective conversions.
 */
export const unitConversionUseCase = defineUseCase<
  UnitConversionInput,
  UnitConversionOutput
>({
  id: 'unit-conversion',
  description: 'Convert between different units of measurement for ingredients',
  modelRole: MODEL_ROLES.SECONDARY, // Always uses secondary model

  systemPrompt: `You are a precise unit conversion assistant for cooking and baking.

Your task is to convert ingredient amounts between different units accurately.

INPUT SCHEMA:
- amount: number - the quantity to convert
- fromUnit: string - the source unit (e.g., "g", "cup", "tbsp")
- toUnit: string - the target unit (e.g., "ml", "oz", "tsp")
- ingredientName: string - the name of the ingredient being converted
- fromCategory: string (optional) - category of fromUnit ("weight", "volume", or "count")
- toCategory: string (optional) - category of toUnit ("weight", "volume", or "count")

CONVERSION RULES:
1. For same-category conversions (e.g., cups to tablespoons), use standard conversion factors
2. For cross-category conversions (weight ↔ volume), use the ingredient's typical density:
   - Water-based liquids: ~1 g/ml
   - Flour: ~0.5-0.6 g/ml
   - Sugar: ~0.8-0.85 g/ml
   - Butter: ~0.9 g/ml
   - Oil: ~0.92 g/ml
   - Honey: ~1.4 g/ml
3. For count conversions (pieces, cloves, slices), use typical weights:
   - Garlic clove: ~5g
   - Egg: ~50g
   - Slice of bread: ~25-30g
4. Return results rounded to 2 decimal places maximum
5. If the conversion is approximate or estimated, set isEstimated to true
6. If you cannot perform the conversion accurately, set isEstimated to true and explain in the note

OUTPUT SCHEMA (JSON only):
{
  "amount": number,        // The converted amount
  "unit": string,          // The target unit
  "isEstimated": boolean,  // true if conversion is approximate
  "note": string (optional) // Explanation if estimated or caveats
}

Respond ONLY with the JSON object. No markdown, no explanation.`,

  buildMessages: (input) => {
    const { amount, fromUnit, toUnit, ingredientName, fromCategory, toCategory } =
      input;

    const userPrompt = `Convert the following ingredient amount:

<ingredient>
${ingredientName}
</ingredient>

<conversion>
${amount} ${fromUnit} → ${toUnit}
</conversion>

${fromCategory && toCategory ? `<categories>
From: ${fromCategory}
To: ${toCategory}
</categories>` : ''}

Provide the result as a JSON object matching the output schema.`;

    return [{ role: 'user', content: userPrompt }];
  },

  parseResponse: (result) => {
    try {
      // Try to parse as JSON first
      const content = result.content.trim();
      // Remove markdown code blocks if present
      const jsonContent = content.replace(/^```json\s*|\s*```$/g, '').trim();
      const parsed = JSON.parse(jsonContent);

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
  maxTokens: 200,
});

/**
 * Convenience function for unit conversion
 *
 * Uses the secondary AI model (as configured in AI settings) for cost-effective conversions.
 * Falls back to estimation if AI is unavailable.
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
