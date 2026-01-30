import { BaseRepository } from './base-repository';
import type { Recipe, Ingredient, InstructionSection } from '@/types/models';

// Database row types
interface RecipeRow {
  id: string;
  name: string;
  cook_time_min: number | null;
  servings: number | null;
  favorite: number;
  image_url: string | null;
  image_width: number | null;
  image_height: number | null;
  updated_at: number;
  template_id: string;
}

interface TagRow {
  name: string;
}

interface TemplateNameRow {
  name: string;
}

interface IngredientRow {
  id: string;
  text: string;
}

interface SectionRow {
  id: string;
  name: string;
  content: string;
}

/**
 * Repository for Recipe-related database operations
 */
export class RecipeRepository extends BaseRepository {
  private static instance: RecipeRepository;

  static getInstance(): RecipeRepository {
    if (!RecipeRepository.instance) {
      RecipeRepository.instance = new RecipeRepository();
    }
    return RecipeRepository.instance;
  }

  /**
   * Get all recipes with basic info (for list views)
   */
  async getAll(): Promise<Recipe[]> {
    return this.execute(async (db) => {
      const rows = await db.getAllAsync<RecipeRow>(
        `SELECT id, name, cook_time_min, servings, favorite, image_url, image_width, image_height, updated_at, template_id
         FROM recipes
         WHERE deleted_at IS NULL
         ORDER BY updated_at DESC`
      );

      const recipes: Recipe[] = [];
      for (const row of rows) {
        const [tags, templateName] = await Promise.all([
          this.getTagsForRecipe(row.id),
          this.getTemplateName(row.id),
        ]);

        recipes.push(this.mapToRecipe(row, tags, templateName));
      }

      return recipes;
    });
  }

  /**
   * Get recipes filtered by tag
   */
  async getByTag(tag: string): Promise<Recipe[]> {
    return this.execute(async (db) => {
      const rows = await db.getAllAsync<RecipeRow>(
        `SELECT r.id, r.name, r.cook_time_min, r.servings, r.favorite, r.image_url, r.image_width, r.image_height, r.updated_at, r.template_id
         FROM recipes r
         JOIN recipe_tags rt ON rt.recipe_id = r.id
         JOIN tags t ON t.id = rt.tag_id
         WHERE r.deleted_at IS NULL AND t.name = ?
         ORDER BY r.updated_at DESC`,
        [tag]
      );

      const recipes: Recipe[] = [];
      for (const row of rows) {
        const [tags, templateName] = await Promise.all([
          this.getTagsForRecipe(row.id),
          this.getTemplateName(row.id),
        ]);

        recipes.push(this.mapToRecipe(row, tags, templateName));
      }

      return recipes;
    });
  }

  /**
   * Get favorite recipes
   */
  async getFavorites(): Promise<Recipe[]> {
    return this.execute(async (db) => {
      const rows = await db.getAllAsync<RecipeRow>(
        `SELECT id, name, cook_time_min, servings, favorite, image_url, image_width, image_height, updated_at, template_id
         FROM recipes
         WHERE deleted_at IS NULL AND favorite = 1
         ORDER BY updated_at DESC`
      );

      const recipes: Recipe[] = [];
      for (const row of rows) {
        const [tags, templateName] = await Promise.all([
          this.getTagsForRecipe(row.id),
          this.getTemplateName(row.id),
        ]);

        recipes.push(this.mapToRecipe(row, tags, templateName));
      }

      return recipes;
    });
  }

  /**
   * Search recipes by name or tag
   */
  async search(query: string): Promise<Recipe[]> {
    const searchTerm = `%${query.toLowerCase()}%`;

    return this.execute(async (db) => {
      const rows = await db.getAllAsync<RecipeRow>(
        `SELECT DISTINCT r.id, r.name, r.cook_time_min, r.servings, r.favorite, r.image_url, r.image_width, r.image_height, r.updated_at, r.template_id
         FROM recipes r
         LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
         LEFT JOIN tags t ON t.id = rt.tag_id
         WHERE r.deleted_at IS NULL
           AND (LOWER(r.name) LIKE ? OR LOWER(t.name) LIKE ?)
         ORDER BY r.updated_at DESC`,
        [searchTerm, searchTerm]
      );

      const recipes: Recipe[] = [];
      for (const row of rows) {
        const [tags, templateName] = await Promise.all([
          this.getTagsForRecipe(row.id),
          this.getTemplateName(row.id),
        ]);

        recipes.push(this.mapToRecipe(row, tags, templateName));
      }

      return recipes;
    });
  }

  /**
   * Get a single recipe with full details
   */
  async getById(id: string): Promise<Recipe | null> {
    return this.execute(async (db) => {
      const row = await db.getFirstAsync<RecipeRow>(
        `SELECT id, name, cook_time_min, servings, favorite, image_url, image_width, image_height, updated_at, template_id
         FROM recipes
         WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );

      if (!row) return null;

      const [tags, templateName, ingredients, sections] = await Promise.all([
        this.getTagsForRecipe(id),
        this.getTemplateName(id),
        this.getIngredientsForRecipe(id),
        this.getSectionsForRecipe(id),
      ]);

      return this.mapToRecipeWithDetails(row, tags, templateName, ingredients, sections);
    });
  }

  /**
   * Create a new recipe
   */
  async create(data: {
    name: string;
    templateId: string;
    cookTimeMin?: number;
    servings?: number;
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
    ingredients?: Array<{ item: string; amount: number; unit: string }>;
    sections?: Array<{ templateSectionId: string; content: string }>;
    tags?: string[];
  }): Promise<Recipe> {
    return this.execute(async (db) => {
      const id = this.generateId();
      const now = this.now();

      await db.runAsync(
        `INSERT INTO recipes (id, template_id, name, cook_time_min, servings, favorite, image_url, image_width, image_height, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
        [
          id,
          data.templateId,
          data.name,
          data.cookTimeMin ?? null,
          data.servings ?? null,
          data.imageUrl ?? null,
          data.imageWidth ?? null,
          data.imageHeight ?? null,
          now,
          now,
        ]
      );

      // Insert ingredients
      if (data.ingredients?.length) {
        for (let i = 0; i < data.ingredients.length; i++) {
          const ing = data.ingredients[i];
          await db.runAsync(
            `INSERT INTO recipe_ingredients (id, recipe_id, order_index, text)
             VALUES (?, ?, ?, ?)`,
            [this.generateId(), id, i, `${ing.amount} ${ing.unit} ${ing.item}`]
          );
        }
      }

      // Insert sections
      if (data.sections?.length) {
        for (const section of data.sections) {
          await db.runAsync(
            `INSERT INTO recipe_sections (id, recipe_id, template_section_id, content, updated_at)
             VALUES (?, ?, ?, ?, ?)`,
            [this.generateId(), id, section.templateSectionId, section.content, now]
          );
        }
      }

      // Insert tags
      if (data.tags?.length) {
        await this.addTagsToRecipe(id, data.tags);
      }

      const recipe = await this.getById(id);
      if (!recipe) throw new Error('Failed to create recipe');
      return recipe;
    });
  }

  /**
   * Update an existing recipe
   */
  async update(
    id: string,
    data: {
      name?: string;
      cookTimeMin?: number;
      servings?: number;
      favorite?: boolean;
      imageUrl?: string;
      imageWidth?: number;
      imageHeight?: number;
    }
  ): Promise<Recipe> {
    return this.execute(async (db) => {
      const updates: string[] = [];
      const values: (string | number | null)[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.cookTimeMin !== undefined) {
        updates.push('cook_time_min = ?');
        values.push(data.cookTimeMin);
      }
      if (data.servings !== undefined) {
        updates.push('servings = ?');
        values.push(data.servings);
      }
      if (data.favorite !== undefined) {
        updates.push('favorite = ?');
        values.push(data.favorite ? 1 : 0);
      }
      if (data.imageUrl !== undefined) {
        updates.push('image_url = ?');
        values.push(data.imageUrl);
      }
      if (data.imageWidth !== undefined) {
        updates.push('image_width = ?');
        values.push(data.imageWidth);
      }
      if (data.imageHeight !== undefined) {
        updates.push('image_height = ?');
        values.push(data.imageHeight);
      }

      updates.push('updated_at = ?');
      values.push(this.now());
      values.push(id);

      await db.runAsync(
        `UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const recipe = await this.getById(id);
      if (!recipe) throw new Error('Recipe not found after update');
      return recipe;
    });
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<boolean> {
    return this.execute(async (db) => {
      const recipe = await db.getFirstAsync<{ favorite: number }>(
        'SELECT favorite FROM recipes WHERE id = ?',
        [id]
      );

      if (!recipe) throw new Error('Recipe not found');

      const newFavorite = recipe.favorite === 0 ? 1 : 0;
      await db.runAsync(
        'UPDATE recipes SET favorite = ?, updated_at = ? WHERE id = ?',
        [newFavorite, this.now(), id]
      );

      return newFavorite === 1;
    });
  }

  /**
   * Soft delete a recipe
   */
  async delete(id: string): Promise<void> {
    return this.execute(async (db) => {
      await db.runAsync(
        'UPDATE recipes SET deleted_at = ? WHERE id = ?',
        [this.now(), id]
      );
    });
  }

  // Private helper methods

  private async getTagsForRecipe(recipeId: string): Promise<string[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<TagRow>(
      `SELECT t.name FROM tags t
       JOIN recipe_tags rt ON rt.tag_id = t.id
       WHERE rt.recipe_id = ?`,
      [recipeId]
    );
    return rows.map((r) => r.name);
  }

  private async getTemplateName(recipeId: string): Promise<string> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<TemplateNameRow>(
      `SELECT t.name FROM templates t
       JOIN recipes r ON r.template_id = t.id
       WHERE r.id = ?`,
      [recipeId]
    );
    return row?.name ?? 'Unknown';
  }

  private async getIngredientsForRecipe(recipeId: string): Promise<Ingredient[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<IngredientRow>(
      `SELECT id, text FROM recipe_ingredients WHERE recipe_id = ? ORDER BY order_index ASC`,
      [recipeId]
    );

    return rows.map((row) => {
      const parts = row.text.split(' ');
      const amount = parseFloat(parts[0]) || 1;
      const unit = parts[1] || '';
      const item = parts.slice(2).join(' ') || row.text;
      return { id: row.id, item, amount, unit };
    });
  }

  private async getSectionsForRecipe(
    recipeId: string
  ): Promise<InstructionSection[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<SectionRow>(
      `SELECT rs.id, ts.name, rs.content
       FROM recipe_sections rs
       JOIN template_sections ts ON rs.template_section_id = ts.id
       WHERE rs.recipe_id = ?
       ORDER BY ts.order_index ASC`,
      [recipeId]
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      steps: row.content.split('\n').filter((s) => s.trim()),
    }));
  }

  private async addTagsToRecipe(recipeId: string, tagNames: string[]): Promise<void> {
    const db = await this.getDb();

    for (const tagName of tagNames) {
      // Get or create tag
      let tagId: string;
      const existingTag = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM tags WHERE name = ?',
        [tagName]
      );

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        tagId = this.generateId();
        await db.runAsync('INSERT INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);
      }

      // Link tag to recipe
      await db.runAsync(
        'INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)',
        [recipeId, tagId]
      );
    }
  }

  private mapToRecipe(
    row: RecipeRow,
    tags: string[],
    templateName: string
  ): Recipe {
    return {
      id: row.id,
      title: row.name,
      template: templateName,
      time: row.cook_time_min ? `${row.cook_time_min} min` : '',
      servings: row.servings ?? 1,
      tags,
      lastUpdated: new Date(row.updated_at).toLocaleDateString(),
      timesCooked: 0,
      imageUrl: row.image_url ?? undefined,
      imageWidth: row.image_width ?? undefined,
      imageHeight: row.image_height ?? undefined,
      isFavorite: row.favorite === 1,
      ingredients: [],
      instructionSections: [],
    };
  }

  private mapToRecipeWithDetails(
    row: RecipeRow,
    tags: string[],
    templateName: string,
    ingredients: Ingredient[],
    sections: InstructionSection[]
  ): Recipe {
    return {
      ...this.mapToRecipe(row, tags, templateName),
      ingredients,
      instructionSections: sections,
    };
  }
}

// Export singleton instance
export const recipeRepository = RecipeRepository.getInstance();
