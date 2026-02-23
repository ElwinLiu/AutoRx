import type { SQLiteDatabase } from 'expo-sqlite';
import { BaseRepository } from './base-repository';
import type { Recipe, Ingredient, InstructionSection, RecipeImage } from '@/types/models';

// Database row types
interface RecipeRow {
  id: string;
  name: string;
  cook_time_min: number | null;
  servings: number | null;
  favorite: number;
  updated_at: number;
}

interface RecipeImageRow {
  id: string;
  recipe_id: string;
  url: string;
  width: number | null;
  height: number | null;
  order_index: number;
}

interface TagRow {
  name: string;
}

interface TagLinkRow {
  recipe_id: string;
  name: string;
}

interface IngredientRow {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
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
        `SELECT id, name, cook_time_min, servings, favorite, updated_at
         FROM recipes
         WHERE deleted_at IS NULL
         ORDER BY updated_at DESC`
      );
      return this.mapRowsToRecipes(rows);
    });
  }

  /**
   * Get recipes filtered by tag
   */
  async getByTag(tag: string): Promise<Recipe[]> {
    const normalizedTag = tag.trim();
    return this.execute(async (db) => {
      const rows = await db.getAllAsync<RecipeRow>(
        `SELECT r.id, r.name, r.cook_time_min, r.servings, r.favorite, r.updated_at
         FROM recipes r
         WHERE r.deleted_at IS NULL
           AND EXISTS (
             SELECT 1
             FROM recipe_tags rt
             JOIN tags t ON t.id = rt.tag_id
             WHERE rt.recipe_id = r.id AND t.name = ? COLLATE NOCASE
           )
         ORDER BY r.updated_at DESC`,
        [normalizedTag]
      );
      return this.mapRowsToRecipes(rows);
    });
  }

  /**
   * Get favorite recipes
   */
  async getFavorites(): Promise<Recipe[]> {
    return this.execute(async (db) => {
      const rows = await db.getAllAsync<RecipeRow>(
        `SELECT id, name, cook_time_min, servings, favorite, updated_at
         FROM recipes
         WHERE deleted_at IS NULL AND favorite = 1
         ORDER BY updated_at DESC`
      );
      return this.mapRowsToRecipes(rows);
    });
  }

  /**
   * Get recipes under a max cook time (minutes)
   */
  async getByCookTimeMax(maxMinutes: number): Promise<Recipe[]> {
    return this.execute(async (db) => {
      const rows = await db.getAllAsync<RecipeRow>(
        `SELECT id, name, cook_time_min, servings, favorite, updated_at
         FROM recipes
         WHERE deleted_at IS NULL AND cook_time_min IS NOT NULL AND cook_time_min <= ?
         ORDER BY updated_at DESC`,
        [maxMinutes]
      );
      return this.mapRowsToRecipes(rows);
    });
  }

  /**
   * Search recipes by name or tag
   */
  async search(query: string): Promise<Recipe[]> {
    const searchTerm = `%${query}%`;

    return this.execute(async (db) => {
      const rows = await db.getAllAsync<RecipeRow>(
        `SELECT r.id, r.name, r.cook_time_min, r.servings, r.favorite, r.updated_at
         FROM recipes r
         WHERE r.deleted_at IS NULL
           AND (
             r.name LIKE ? COLLATE NOCASE
             OR EXISTS (
               SELECT 1
               FROM recipe_tags rt
               JOIN tags t ON t.id = rt.tag_id
               WHERE rt.recipe_id = r.id AND t.name LIKE ? COLLATE NOCASE
             )
           )
         ORDER BY r.updated_at DESC`,
        [searchTerm, searchTerm]
      );
      return this.mapRowsToRecipes(rows);
    });
  }

  /**
   * Get a single recipe with full details
   */
  async getById(id: string): Promise<Recipe | null> {
    return this.execute(async (db) => {
      const row = await db.getFirstAsync<RecipeRow>(
        `SELECT id, name, cook_time_min, servings, favorite, updated_at
         FROM recipes
         WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );

      if (!row) return null;

      const [tags, ingredients, sections, images] = await Promise.all([
        this.getTagsForRecipe(id),
        this.getIngredientsForRecipe(id),
        this.getSectionsForRecipe(id),
        this.getImagesForRecipe(id),
      ]);

      return this.mapToRecipeWithDetails(row, tags, ingredients, sections, images);
    });
  }

  /**
   * Create a new recipe
   */
  async create(data: {
    name: string;
    cookTimeMin?: number;
    servings?: number;
    images?: Array<{ url: string; width?: number; height?: number }>;
    ingredients?: Array<{ item: string; amount: number; unit: string }>;
    sections?: Array<{ name: string; content: string }>;
    tags?: string[];
  }): Promise<Recipe> {
    return this.execute(async (db) => {
      const id = this.generateId();
      const now = this.now();

      await db.execAsync('BEGIN TRANSACTION');

      try {
        await db.runAsync(
          `INSERT INTO recipes (id, name, cook_time_min, servings, favorite, created_at, updated_at)
           VALUES (?, ?, ?, ?, 0, ?, ?)`,
          [
            id,
            data.name,
            data.cookTimeMin ?? null,
            data.servings ?? null,
            now,
            now,
          ]
        );

        // Insert images
        if (data.images?.length) {
          for (let i = 0; i < data.images.length; i++) {
            const img = data.images[i];
            await db.runAsync(
              `INSERT INTO recipe_images (id, recipe_id, url, width, height, order_index, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                this.generateId(),
                id,
                img.url,
                img.width ?? null,
                img.height ?? null,
                i,
                now,
              ]
            );
          }
        }

        // Insert ingredients
        if (data.ingredients?.length) {
          for (const ing of data.ingredients) {
            await db.runAsync(
              `INSERT INTO recipe_ingredients (id, recipe_id, name, amount, unit)
               VALUES (?, ?, ?, ?, ?)`,
              [this.generateId(), id, ing.item, ing.amount ?? null, ing.unit ?? null]
            );
          }
        }

        // Insert sections
        if (data.sections?.length) {
          for (const section of data.sections) {
            await db.runAsync(
              `INSERT INTO recipe_sections (id, recipe_id, name, content, updated_at)
               VALUES (?, ?, ?, ?, ?)`,
              [this.generateId(), id, section.name, section.content, now]
            );
          }
        }

        // Insert tags
        if (data.tags?.length) {
          await this.addTagsToRecipe(id, data.tags, db);
        }

        await db.execAsync('COMMIT');
      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
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
      images?: Array<{ url: string; width?: number; height?: number }>;
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

      if (updates.length > 0) {
        updates.push('updated_at = ?');
        values.push(this.now());
        values.push(id);

        await db.runAsync(
          `UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }

      // Update images if provided
      if (data.images !== undefined) {
        await this.updateRecipeImages(id, data.images, db);
      }

      const recipe = await this.getById(id);
      if (!recipe) throw new Error('Recipe not found after update');
      return recipe;
    });
  }

  /**
   * Update recipe images (replaces all existing images)
   */
  private async updateRecipeImages(
    recipeId: string,
    images: Array<{ url: string; width?: number; height?: number }>,
    dbOverride?: SQLiteDatabase
  ): Promise<void> {
    const db = dbOverride ?? await this.getDb();
    const now = this.now();

    // Delete existing images
    await db.runAsync('DELETE FROM recipe_images WHERE recipe_id = ?', [recipeId]);

    // Insert new images
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      await db.runAsync(
        `INSERT INTO recipe_images (id, recipe_id, url, width, height, order_index, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          this.generateId(),
          recipeId,
          img.url,
          img.width ?? null,
          img.height ?? null,
          i,
          now,
        ]
      );
    }
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

  /**
   * Get all unique tags from the database
   */
  async getAllTags(): Promise<string[]> {
    return this.execute(async (db) => {
      const rows = await db.getAllAsync<TagRow>(
        `SELECT name FROM tags ORDER BY name COLLATE NOCASE ASC`
      );
      return rows.map((r) => r.name);
    });
  }

  /**
   * Search tags by partial match
   */
  async searchTags(query: string): Promise<string[]> {
    const searchTerm = `%${query}%`;
    return this.execute(async (db) => {
      const rows = await db.getAllAsync<TagRow>(
        `SELECT name FROM tags WHERE name LIKE ? COLLATE NOCASE ORDER BY name COLLATE NOCASE ASC`,
        [searchTerm]
      );
      return rows.map((r) => r.name);
    });
  }

  // Private helper methods

  private async getTagsForRecipe(recipeId: string): Promise<string[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<TagRow>(
      `SELECT t.name FROM tags t
       JOIN recipe_tags rt ON rt.tag_id = t.id
       WHERE rt.recipe_id = ?
       ORDER BY t.name COLLATE NOCASE ASC`,
      [recipeId]
    );
    return rows.map((r) => r.name);
  }

  private async getTagsForRecipes(recipeIds: string[]): Promise<Record<string, string[]>> {
    if (recipeIds.length === 0) return {};

    const db = await this.getDb();
    const placeholders = recipeIds.map(() => '?').join(', ');
    const rows = await db.getAllAsync<TagLinkRow>(
      `SELECT rt.recipe_id as recipe_id, t.name as name
       FROM recipe_tags rt
       JOIN tags t ON t.id = rt.tag_id
       WHERE rt.recipe_id IN (${placeholders})
       ORDER BY t.name COLLATE NOCASE ASC`,
      recipeIds
    );

    const map: Record<string, string[]> = {};
    for (const row of rows) {
      if (!map[row.recipe_id]) {
        map[row.recipe_id] = [];
      }
      map[row.recipe_id].push(row.name);
    }
    return map;
  }

  private async getImagesForRecipes(recipeIds: string[]): Promise<Record<string, RecipeImage[]>> {
    if (recipeIds.length === 0) return {};

    const db = await this.getDb();
    const placeholders = recipeIds.map(() => '?').join(', ');
    const rows = await db.getAllAsync<RecipeImageRow>(
      `SELECT id, recipe_id, url, width, height, order_index
       FROM recipe_images
       WHERE recipe_id IN (${placeholders})
       ORDER BY recipe_id, order_index ASC`,
      recipeIds
    );

    const map: Record<string, RecipeImage[]> = {};
    for (const row of rows) {
      if (!map[row.recipe_id]) {
        map[row.recipe_id] = [];
      }
      map[row.recipe_id].push({
        id: row.id,
        url: row.url,
        width: row.width ?? undefined,
        height: row.height ?? undefined,
        orderIndex: row.order_index,
      });
    }
    return map;
  }

  private async mapRowsToRecipes(rows: RecipeRow[]): Promise<Recipe[]> {
    const tagsByRecipe = await this.getTagsForRecipes(rows.map((row) => row.id));
    const imagesByRecipe = await this.getImagesForRecipes(rows.map((row) => row.id));
    return rows.map((row) => this.mapToRecipe(row, tagsByRecipe[row.id] ?? [], imagesByRecipe[row.id] ?? []));
  }

  private async getIngredientsForRecipe(recipeId: string): Promise<Ingredient[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<IngredientRow>(
      `SELECT id, name, amount, unit FROM recipe_ingredients WHERE recipe_id = ?`,
      [recipeId]
    );

    return rows.map((row) => ({
      id: row.id,
      item: row.name,
      amount: row.amount ?? 1,
      unit: row.unit ?? '',
    }));
  }

  private async getSectionsForRecipe(
    recipeId: string
  ): Promise<InstructionSection[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<SectionRow>(
      `SELECT id, name, content
       FROM recipe_sections
       WHERE recipe_id = ?`,
      [recipeId]
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      steps: row.content.split('\n').filter((s) => s.trim()),
    }));
  }

  private async addTagsToRecipe(
    recipeId: string,
    tagNames: string[],
    dbOverride?: SQLiteDatabase
  ): Promise<void> {
    const db = dbOverride ?? await this.getDb();

    for (const rawTagName of tagNames) {
      const tagName = rawTagName.trim();
      if (!tagName) continue;
      // Get or create tag
      let tagId: string;
      const existingTag = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM tags WHERE name = ? COLLATE NOCASE',
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

  private async getImagesForRecipe(recipeId: string): Promise<RecipeImage[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<RecipeImageRow>(
      `SELECT id, recipe_id, url, width, height, order_index 
       FROM recipe_images 
       WHERE recipe_id = ? 
       ORDER BY order_index ASC`,
      [recipeId]
    );

    return rows.map((row) => ({
      id: row.id,
      url: row.url,
      width: row.width ?? undefined,
      height: row.height ?? undefined,
      orderIndex: row.order_index,
    }));
  }

  private mapToRecipe(
    row: RecipeRow,
    tags: string[],
    images: RecipeImage[]
  ): Recipe {
    return {
      id: row.id,
      title: row.name,
      time: row.cook_time_min ? `${row.cook_time_min} min` : '',
      servings: row.servings ?? 1,
      tags,
      lastUpdated: new Date(row.updated_at).toLocaleDateString(),
      timesCooked: 0,
      images,
      isFavorite: row.favorite === 1,
      ingredients: [],
      instructionSections: [],
    };
  }

  private mapToRecipeWithDetails(
    row: RecipeRow,
    tags: string[],
    ingredients: Ingredient[],
    sections: InstructionSection[],
    images: RecipeImage[]
  ): Recipe {
    return {
      ...this.mapToRecipe(row, tags, images),
      ingredients,
      instructionSections: sections,
    };
  }
}

// Export singleton instance
export const recipeRepository = RecipeRepository.getInstance();
