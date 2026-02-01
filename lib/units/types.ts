export type UnitCategory = 'weight' | 'volume' | 'count';

export type UnitDefinition = {
  id: string;
  name: string;
  category: UnitCategory;
  symbol: string;
  displayName: string;
};

export type ConversionResult = {
  amount: number;
  unit: string;
  isEstimated: boolean;
};

export type CategoryOption = {
  id: UnitCategory;
  name: string;
  icon: string;
  description: string;
};
