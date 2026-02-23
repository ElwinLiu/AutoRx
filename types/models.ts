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

export type RecipeImage = {
  id: string;
  url: string;
  width?: number;
  height?: number;
  orderIndex: number;
};

export type Recipe = {
  id: string;
  title: string;
  time: string;
  servings: number;
  tags: string[];
  lastUpdated: string;
  timesCooked: number;
  images: RecipeImage[];
  isFavorite: boolean;
  ingredients: Ingredient[];
  instructionSections: InstructionSection[];
};
