import { UnitDefinition, CategoryOption } from './types';

export const UNIT_CATEGORIES: CategoryOption[] = [
  {
    id: 'weight',
    name: 'Weight',
    icon: 'scale-outline',
    description: 'Grams, ounces, pounds...',
  },
  {
    id: 'volume',
    name: 'Volume',
    icon: 'beaker-outline',
    description: 'Cups, tablespoons, ml...',
  },
  {
    id: 'count',
    name: 'Count',
    icon: 'cube-outline',
    description: 'Pieces, cloves, slices...',
  },
];

const WEIGHT_UNITS: UnitDefinition[] = [
  { id: 'mg', name: 'Milligram', category: 'weight', symbol: 'mg', displayName: 'Milligram (mg)' },
  { id: 'g', name: 'Gram', category: 'weight', symbol: 'g', displayName: 'Gram (g)' },
  { id: 'kg', name: 'Kilogram', category: 'weight', symbol: 'kg', displayName: 'Kilogram (kg)' },
  { id: 'oz', name: 'Ounce', category: 'weight', symbol: 'oz', displayName: 'Ounce (oz)' },
  { id: 'lb', name: 'Pound', category: 'weight', symbol: 'lb', displayName: 'Pound (lb)' },
];

const VOLUME_UNITS: UnitDefinition[] = [
  { id: 'ml', name: 'Milliliter', category: 'volume', symbol: 'ml', displayName: 'Milliliter (ml)' },
  { id: 'l', name: 'Liter', category: 'volume', symbol: 'L', displayName: 'Liter (L)' },
  { id: 'tsp', name: 'Teaspoon', category: 'volume', symbol: 'tsp', displayName: 'Teaspoon (tsp)' },
  { id: 'tbsp', name: 'Tablespoon', category: 'volume', symbol: 'tbsp', displayName: 'Tablespoon (tbsp)' },
  { id: 'fl_oz', name: 'Fluid Ounce', category: 'volume', symbol: 'fl oz', displayName: 'Fluid Ounce (fl oz)' },
  { id: 'cup', name: 'Cup', category: 'volume', symbol: 'cup', displayName: 'Cup' },
  { id: 'pint', name: 'Pint', category: 'volume', symbol: 'pt', displayName: 'Pint (pt)' },
  { id: 'quart', name: 'Quart', category: 'volume', symbol: 'qt', displayName: 'Quart (qt)' },
];

const COUNT_UNITS: UnitDefinition[] = [
  { id: 'piece', name: 'Piece', category: 'count', symbol: 'pc', displayName: 'Piece' },
  { id: 'clove', name: 'Clove', category: 'count', symbol: 'clove', displayName: 'Clove' },
  { id: 'slice', name: 'Slice', category: 'count', symbol: 'slice', displayName: 'Slice' },
  { id: 'bunch', name: 'Bunch', category: 'count', symbol: 'bunch', displayName: 'Bunch' },
  { id: 'pinch', name: 'Pinch', category: 'count', symbol: 'pinch', displayName: 'Pinch' },
  { id: 'dash', name: 'Dash', category: 'count', symbol: 'dash', displayName: 'Dash' },
  { id: 'stalk', name: 'Stalk', category: 'count', symbol: 'stalk', displayName: 'Stalk' },
  { id: 'leaf', name: 'Leaf', category: 'count', symbol: 'leaf', displayName: 'Leaf' },
];

// All units combined
const ALL_UNITS: UnitDefinition[] = [
  ...WEIGHT_UNITS,
  ...VOLUME_UNITS,
  ...COUNT_UNITS,
];

// Conversion factors to base units
// Weight base: grams (g)
// Volume base: milliliters (ml)
export const CONVERSION_FACTORS: Record<string, number> = {
  // Weight to grams
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,

  // Volume to milliliters
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  fl_oz: 29.5735,
  cup: 236.588,
  pint: 473.176,
  quart: 946.353,
};

// Get units for a specific category
export function getUnitsByCategory(category: string): UnitDefinition[] {
  switch (category) {
    case 'weight':
      return WEIGHT_UNITS;
    case 'volume':
      return VOLUME_UNITS;
    case 'count':
      return COUNT_UNITS;
    default:
      return [];
  }
}

// Get unit definition by ID
function getUnitById(unitId: string): UnitDefinition | undefined {
  return ALL_UNITS.find((u) => u.id === unitId);
}

// Get category of a unit
export function getUnitCategory(unitId: string): string | undefined {
  const unit = getUnitById(unitId);
  return unit?.category;
}
