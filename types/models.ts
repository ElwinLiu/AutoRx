export type Ingredient = {
  id: string;
  item: string;
  amount: number;
  unit: string;
};

export type InstructionSection = {
  id: string;
  name: string;
  steps: string[];
};

export type Recipe = {
  id: string;
  title: string;
  template: string;
  time: string;
  servings: number;
  tags: string[];
  lastUpdated: string;
  timesCooked: number;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  isFavorite: boolean;
  ingredients: Ingredient[];
  instructionSections: InstructionSection[];
};

export type Template = {
  id: string;
  name: string;
  instructionSections: { id: string; name: string }[];
  lastEdited?: string;
  isDefault?: boolean;
};
