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

CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_name_nocase
  ON templates(name COLLATE NOCASE);

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
    await ensureCaseInsensitiveTemplates(db);
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

    const hasTemplateId = columnNames.includes('template_id');
    const hasTemplateName = columnNames.includes('template_name');

    // Already on the new schema (no template_id, no template_name)
    if (!hasTemplateId && !hasTemplateName) {
      // Ensure image columns exist (safety for older installs)
      const missingImages = ['image_url', 'image_width', 'image_height'].filter(
        (name) => !columnNames.includes(name)
      );
      if (missingImages.length > 0) {
        for (const column of missingImages) {
          const type = column === 'image_url' ? 'TEXT' : 'INTEGER';
          await db.execAsync(`ALTER TABLE recipes ADD COLUMN ${column} ${type};`);
        }
      }
      return;
    }

    await db.execAsync(`
      CREATE TABLE recipes_new (
        id TEXT PRIMARY KEY,
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
    `);

    const sourceUrlExpr = columnNames.includes('source_url') ? 'r.source_url' : 'NULL';
    const imageUrlExpr = columnNames.includes('image_url') ? 'r.image_url' : 'NULL';
    const imageWidthExpr = columnNames.includes('image_width') ? 'r.image_width' : 'NULL';
    const imageHeightExpr = columnNames.includes('image_height') ? 'r.image_height' : 'NULL';

    await db.execAsync(`
      INSERT INTO recipes_new (
        id, name, cook_time_min, servings, favorite,
        source_url, image_url, image_width, image_height,
        created_at, updated_at, deleted_at
      )
      SELECT
        r.id,
        r.name,
        r.cook_time_min,
        r.servings,
        r.favorite,
        ${sourceUrlExpr} AS source_url,
        ${imageUrlExpr} AS image_url,
        ${imageWidthExpr} AS image_width,
        ${imageHeightExpr} AS image_height,
        r.created_at,
        r.updated_at,
        r.deleted_at
      FROM recipes r;
    `);

    await db.execAsync('DROP TABLE recipes;');
    await db.execAsync('ALTER TABLE recipes_new RENAME TO recipes;');
  } catch (error) {
    console.error('Migration error for recipes:', error);
  }
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

async function ensureCaseInsensitiveTemplates(db: SQLiteDatabase): Promise<void> {
  try {
    const templates = await db.getAllAsync<{ id: string; name: string }>(
      'SELECT id, name FROM templates'
    );

    const usedNames = new Set<string>(templates.map((t) => t.name.toLowerCase()));
    const byLower = new Map<string, Array<{ id: string; name: string }>>();

    for (const template of templates) {
      const key = template.name.toLowerCase();
      const list = byLower.get(key) ?? [];
      list.push(template);
      byLower.set(key, list);
    }

    for (const [, list] of byLower) {
      if (list.length <= 1) continue;

      const baseName = list[0].name;
      let suffix = 2;

      for (const dup of list.slice(1)) {
        let newName = `${baseName} (${suffix})`;
        while (usedNames.has(newName.toLowerCase())) {
          suffix += 1;
          newName = `${baseName} (${suffix})`;
        }

        await db.runAsync('UPDATE templates SET name = ? WHERE id = ?', [newName, dup.id]);
        usedNames.add(newName.toLowerCase());
        suffix += 1;
      }
    }
  } catch (error) {
    console.error('Migration error for templates dedupe:', error);
  }
}

async function ensureIndexes(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_name_nocase
      ON templates(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_template_sections_order
      ON template_sections(template_id, order_index);
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
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS template_sections;
DROP TABLE IF EXISTS templates;
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
