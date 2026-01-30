import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'autorx.db';

const CREATE_TABLES_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS template_sections (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES templates(id),
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(template_id, name COLLATE NOCASE)
);

CREATE INDEX IF NOT EXISTS idx_template_sections_order
  ON template_sections(template_id, order_index);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES templates(id),
  name TEXT NOT NULL,
  cook_time_min INTEGER,
  servings REAL,
  favorite INTEGER NOT NULL DEFAULT 0,
  source_url TEXT,
  image_url TEXT,
  image_width INTEGER,
  image_height INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_recipes_updated ON recipes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_fav_updated ON recipes(favorite, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_template ON recipes(template_id);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  order_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  amount REAL,
  unit TEXT
);

CREATE INDEX IF NOT EXISTS idx_ingredients_recipe
  ON recipe_ingredients(recipe_id, order_index);

CREATE TABLE IF NOT EXISTS recipe_sections (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  template_section_id TEXT NOT NULL REFERENCES template_sections(id),
  content TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL,
  UNIQUE(recipe_id, template_section_id)
);

CREATE INDEX IF NOT EXISTS idx_sections_recipe ON recipe_sections(recipe_id);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag_id);

CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  error_text TEXT,
  template_id TEXT REFERENCES templates(id),
  recipe_id TEXT REFERENCES recipes(id),
  created_at INTEGER NOT NULL,
  finished_at INTEGER
);

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
  // Migration: Add image columns to recipes table if they don't exist
  try {
    // Check if image_url column exists
    const tableInfo = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(recipes)"
    );
    const columnNames = tableInfo.map(col => col.name);

    if (!columnNames.includes('image_url')) {
      console.log('Running migration: Adding image columns to recipes table');
      await db.execAsync(`
        ALTER TABLE recipes ADD COLUMN image_url TEXT;
        ALTER TABLE recipes ADD COLUMN image_width INTEGER;
        ALTER TABLE recipes ADD COLUMN image_height INTEGER;
      `);
      console.log('Migration completed: image columns added');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }

  // Migration: Update recipe_ingredients table to use structured columns
  try {
    const tableInfo = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(recipe_ingredients)"
    );
    const columnNames = tableInfo.map(col => col.name);

    // Check if we need to migrate from old schema (has 'text' column, no 'name' column)
    if (columnNames.includes('text') && !columnNames.includes('name')) {
      // Drop temp table if exists from previous failed attempt
      await db.execAsync(`DROP TABLE IF EXISTS recipe_ingredients_new;`);

      // Create new table with correct schema (without FK constraint initially to avoid issues)
      await db.execAsync(`
        CREATE TABLE recipe_ingredients_new (
          id TEXT PRIMARY KEY,
          recipe_id TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          name TEXT NOT NULL,
          amount REAL,
          unit TEXT
        );
      `);

      // Copy data from old table to new table
      await db.execAsync(`
        INSERT INTO recipe_ingredients_new (id, recipe_id, order_index, name, amount, unit)
        SELECT id, recipe_id, order_index,
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
          END as unit
        FROM recipe_ingredients;
      `);

      // Drop old table and rename new one
      await db.execAsync(`DROP TABLE recipe_ingredients;`);
      await db.execAsync(`ALTER TABLE recipe_ingredients_new RENAME TO recipe_ingredients;`);

      // Recreate index
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_ingredients_recipe
          ON recipe_ingredients(recipe_id, order_index);
      `);
    }
  } catch (error) {
    console.error('Migration error for recipe_ingredients:', error);
  }
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
