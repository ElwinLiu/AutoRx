import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'autorx.db';

const CREATE_TABLES_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cook_time_min INTEGER,
  servings REAL,
  favorite INTEGER NOT NULL DEFAULT 0,
  source_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS recipe_images (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipe_images_recipe
  ON recipe_images(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_images_order
  ON recipe_images(recipe_id, order_index);

CREATE INDEX IF NOT EXISTS idx_recipes_updated ON recipes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_fav_updated ON recipes(favorite, updated_at DESC);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  name TEXT NOT NULL,
  amount REAL,
  unit TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ingredients_recipe
  ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_order
  ON recipe_ingredients(recipe_id, order_index);

CREATE TABLE IF NOT EXISTS recipe_sections (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sections_recipe ON recipe_sections(recipe_id);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_nocase
  ON tags(name COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

let dbInstance: SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(CREATE_TABLES_SQL);

  // Run migrations for existing databases
  await runMigrations(db);
}

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = OFF;');

  try {
  await migrateRecipesTable(db);
  await migrateRecipeSectionsTable(db);
  await migrateRecipeIngredientsTable(db);
  await ensureCaseInsensitiveTags(db);
  await dropTemplateTables(db);
  await ensureIndexes(db);
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
}

async function getTableColumns(db: SQLiteDatabase, tableName: string): Promise<string[]> {
  const tableInfo = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${tableName})`
  );
  return tableInfo.map((col) => col.name);
}

async function migrateRecipesTable(db: SQLiteDatabase): Promise<void> {
  try {
    const columnNames = await getTableColumns(db, 'recipes');
    if (columnNames.length === 0) return;

    const hasImageUrl = columnNames.includes('image_url');
    const hasTemplateId = columnNames.includes('template_id');
    const hasTemplateName = columnNames.includes('template_name');

    // Create recipe_images table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recipe_images (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
    `);

    // If we have image columns, migrate images to new table then remove columns
    if (hasImageUrl) {
      // Migrate existing images to recipe_images table
      const recipesWithImages = await db.getAllAsync<{
        id: string;
        image_url: string | null;
        image_width: number | null;
        image_height: number | null;
        updated_at: number;
      }>(
        `SELECT id, image_url, image_width, image_height, updated_at 
         FROM recipes 
         WHERE image_url IS NOT NULL`
      );

      for (const recipe of recipesWithImages) {
        const imageId = generateId();
        await db.runAsync(
          `INSERT INTO recipe_images (id, recipe_id, url, width, height, order_index, created_at)
           VALUES (?, ?, ?, ?, ?, 0, ?)`,
          [
            imageId,
            recipe.id,
            recipe.image_url,
            recipe.image_width ?? null,
            recipe.image_height ?? null,
            recipe.updated_at,
          ]
        );
      }
    }

    // If we have old columns (image_url, template_id, template_name), we need to migrate
    if (hasImageUrl || hasTemplateId || hasTemplateName) {
      await db.execAsync(`
        CREATE TABLE recipes_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          cook_time_min INTEGER,
          servings REAL,
          favorite INTEGER NOT NULL DEFAULT 0,
          source_url TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted_at INTEGER
        );
      `);

      const sourceUrlExpr = columnNames.includes('source_url') ? 'r.source_url' : 'NULL';

      await db.execAsync(`
        INSERT INTO recipes_new (
          id, name, cook_time_min, servings, favorite,
          source_url, created_at, updated_at, deleted_at
        )
        SELECT
          r.id,
          r.name,
          r.cook_time_min,
          r.servings,
          r.favorite,
          ${sourceUrlExpr} AS source_url,
          r.created_at,
          r.updated_at,
          r.deleted_at
        FROM recipes r;
      `);

      await db.execAsync('DROP TABLE recipes;');
      await db.execAsync('ALTER TABLE recipes_new RENAME TO recipes;');
    }
  } catch (error) {
    console.error('Migration error for recipes:', error);
  }
}

// Helper function to generate UUID for migrations
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function migrateRecipeSectionsTable(db: SQLiteDatabase): Promise<void> {
  try {
    const columnNames = await getTableColumns(db, 'recipe_sections');
    if (columnNames.length === 0) return;

    const hasTemplateSectionId = columnNames.includes('template_section_id');
    const hasOrderIndex = columnNames.includes('order_index');

    // Already on the new schema (no template_section_id, no order_index)
    if (!hasTemplateSectionId && !hasOrderIndex) {
      return;
    }

    await db.execAsync(`DROP TABLE IF EXISTS recipe_sections_new;`);
    await db.execAsync(`
      CREATE TABLE recipe_sections_new (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL REFERENCES recipes(id),
        name TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        updated_at INTEGER NOT NULL
      );
    `);

    if (hasTemplateSectionId) {
      await db.execAsync(`
        INSERT INTO recipe_sections_new (id, recipe_id, name, content, updated_at)
        SELECT
          rs.id,
          rs.recipe_id,
          COALESCE(ts.name, 'Instructions'),
          rs.content,
          rs.updated_at
        FROM recipe_sections rs
        LEFT JOIN template_sections ts ON ts.id = rs.template_section_id;
      `);
    } else {
      await db.execAsync(`
        INSERT INTO recipe_sections_new (id, recipe_id, name, content, updated_at)
        SELECT id, recipe_id, name, content, updated_at
        FROM recipe_sections;
      `);
    }

    await db.execAsync('DROP TABLE recipe_sections;');
    await db.execAsync('ALTER TABLE recipe_sections_new RENAME TO recipe_sections;');
  } catch (error) {
    console.error('Migration error for recipe_sections:', error);
  }
}

async function migrateRecipeIngredientsTable(db: SQLiteDatabase): Promise<void> {
  try {
    const columnNames = await getTableColumns(db, 'recipe_ingredients');
    if (columnNames.length === 0) return;

    const hasTextColumn = columnNames.includes('text');

    // Already on the new schema (no text column)
    if (!hasTextColumn) {
      return;
    }

    // Migrate from old schema with text column
    await db.execAsync(`DROP TABLE IF EXISTS recipe_ingredients_new;`);

    await db.execAsync(`
      CREATE TABLE recipe_ingredients_new (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL,
        name TEXT NOT NULL,
        amount REAL,
        unit TEXT,
        order_index INTEGER NOT NULL DEFAULT 0
      );
    `);

    await db.execAsync(`
      INSERT INTO recipe_ingredients_new (id, recipe_id, name, amount, unit, order_index)
      SELECT id, recipe_id,
        CASE
          WHEN text LIKE '% % %' THEN substr(text, instr(substr(text, instr(text, ' ') + 1), ' ') + instr(text, ' ') + 1)
          ELSE text
        END as name,
        CASE
          WHEN text LIKE '% %' THEN CAST(substr(text, 1, instr(text, ' ') - 1) AS REAL)
          ELSE NULL
        END as amount,
        CASE
          WHEN text LIKE '% % %' THEN substr(substr(text, instr(text, ' ') + 1), 1, instr(substr(text, instr(text, ' ') + 1), ' ') - 1)
          WHEN text LIKE '% %' THEN substr(text, instr(text, ' ') + 1)
          ELSE NULL
        END as unit,
        0 as order_index
      FROM recipe_ingredients;
    `);

    await db.execAsync(`DROP TABLE recipe_ingredients;`);
    await db.execAsync(`ALTER TABLE recipe_ingredients_new RENAME TO recipe_ingredients;`);
  } catch (error) {
    console.error('Migration error for recipe_ingredients:', error);
  }
}

async function ensureCaseInsensitiveTags(db: SQLiteDatabase): Promise<void> {
  try {
    const duplicates = await db.getAllAsync<{ key: string; ids: string }>(
      `SELECT LOWER(name) as key, GROUP_CONCAT(id) as ids
       FROM tags
       GROUP BY LOWER(name)
       HAVING COUNT(*) > 1`
    );

    for (const dup of duplicates) {
      const ids = dup.ids.split(',');
      const keepId = ids[0];
      const removeIds = ids.slice(1);

      if (removeIds.length > 0) {
        for (const removeId of removeIds) {
          await db.runAsync(
            `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id)
             SELECT recipe_id, ? FROM recipe_tags WHERE tag_id = ?`,
            [keepId, removeId]
          );
          await db.runAsync('DELETE FROM recipe_tags WHERE tag_id = ?', [removeId]);
          await db.runAsync('DELETE FROM tags WHERE id = ?', [removeId]);
        }
      }
    }
  } catch (error) {
    console.error('Migration error for tags dedupe:', error);
  }
}

async function dropTemplateTables(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DROP TABLE IF EXISTS template_sections;
    DROP TABLE IF EXISTS templates;
  `);
}

async function ensureIndexes(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_recipes_updated ON recipes(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_recipes_fav_updated ON recipes(favorite, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ingredients_recipe
      ON recipe_ingredients(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_ingredients_order
      ON recipe_ingredients(recipe_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_sections_recipe
      ON recipe_sections(recipe_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_nocase
      ON tags(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe ON recipe_tags(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_images_recipe
      ON recipe_images(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_images_order
      ON recipe_images(recipe_id, order_index);
  `);
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}

const DROP_TABLES_SQL = `
DROP TABLE IF EXISTS recipe_tags;
DROP TABLE IF EXISTS recipe_sections;
DROP TABLE IF EXISTS recipe_ingredients;
DROP TABLE IF EXISTS recipe_images;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS settings;
`;

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync('PRAGMA foreign_keys = OFF;');
  try {
    await db.execAsync(DROP_TABLES_SQL);
    await db.execAsync(CREATE_TABLES_SQL);
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
}
