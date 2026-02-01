/**
 * Database Seed Script
 *
 * This script seeds the SQLite database with default templates and dummy recipes.
 * It can be run:
 * 1. From within the app (e.g., from a dev menu button)
 * 2. During app initialization
 *
 * Usage in app:
 *   import { seedDatabase } from '@/scripts/seed-database';
 *   await seedDatabase();
 */

import { getDatabase, initDatabase, closeDatabase } from '@/lib/db';

// Generate a simple UUID without external dependencies
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to get current timestamp
function now(): number {
  return Date.now();
}

// Default Templates with their sections
const DEFAULT_TEMPLATES = [
  {
    name: 'Baking',
    sections: ['Preparation', 'Mixing', 'Baking', 'Cooling'],
  },
  {
    name: '中餐',
    sections: ['料头', '料汁', '烹饪', '要点'],
  },
  {
    name: 'Quick Weeknight',
    sections: ['Preparation', 'Cooking'],
  },
  {
    name: 'Meal Prep',
    sections: ['Preparation', 'Cooking', 'Storage'],
  },
];

// Dummy Recipes
const DUMMY_RECIPES = [
  {
    name: 'Kung Pao Chicken',
    templateName: '中餐',
    cookTimeMin: 30,
    servings: 4,
    favorite: true,
    imageUrl:
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    imageWidth: 1080,
    imageHeight: 720,
    ingredients: [
      { name: 'boneless chicken thighs, cut into bite-sized pieces', amount: 1.5, unit: 'lb', orderIndex: 0 },
      { name: 'soy sauce', amount: 2, unit: 'tbsp', orderIndex: 1 },
      { name: 'cornstarch', amount: 1, unit: 'tbsp', orderIndex: 2 },
      { name: 'dried red chilies', amount: 8, unit: '', orderIndex: 3 },
      { name: 'Sichuan peppercorns', amount: 1, unit: 'tsp', orderIndex: 4 },
      { name: 'roasted peanuts', amount: 0.5, unit: 'cup', orderIndex: 5 },
      { name: 'green onions, sliced', amount: 3, unit: '', orderIndex: 6 },
      { name: 'garlic, minced', amount: 4, unit: 'cloves', orderIndex: 7 },
      { name: 'ginger, minced', amount: 1, unit: 'tbsp', orderIndex: 8 },
    ],
    sections: {
      '料头':
        '鸡腿肉切丁，用生抽、料酒、淀粉腌制15分钟。\n干辣椒剪段，去籽。\n大葱切段，姜蒜切末。',
      '料汁':
        '生抽2勺、老抽半勺、料酒1勺、醋1勺、糖1勺、淀粉1勺、清水3勺，调成宫保汁备用。',
      '烹饪':
        '热锅凉油，中小火将花生米炸至金黄酥脆，捞出沥油。\n锅留底油，爆香干辣椒和花椒。\n大火下鸡丁滑炒至变色。\n加入葱姜蒜炒香。\n倒入调好的宫保汁，大火收汁。\n最后加入炸好的花生米，翻炒均匀即可出锅。',
      '要点':
        '鸡丁要大火快炒，保持嫩滑。\n宫保汁要提前调好，一气呵成。\n花生米最后放，保持酥脆口感。\n干辣椒不要炒糊，注意火候。',
    },
    tags: ['Spicy', 'Quick', 'Chinese'],
  },
  {
    name: 'Classic Banana Bread',
    templateName: 'Baking',
    cookTimeMin: 75,
    servings: 8,
    favorite: false,
    imageUrl:
      'https://images.unsplash.com/photo-1599743271551-da8b8faacc5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    imageWidth: 800,
    imageHeight: 1200,
    ingredients: [
      { name: 'ripe bananas, mashed', amount: 3, unit: '', orderIndex: 0 },
      { name: 'melted butter', amount: 1/3, unit: 'cup', orderIndex: 1 },
      { name: 'baking soda', amount: 1, unit: 'tsp', orderIndex: 2 },
      { name: 'salt', amount: 1, unit: 'pinch', orderIndex: 3 },
      { name: 'sugar', amount: 3/4, unit: 'cup', orderIndex: 4 },
      { name: 'large egg, beaten', amount: 1, unit: '', orderIndex: 5 },
      { name: 'vanilla extract', amount: 1, unit: 'tsp', orderIndex: 6 },
      { name: 'all-purpose flour', amount: 1.5, unit: 'cup', orderIndex: 7 },
    ],
    sections: {
      Preparation:
        'Preheat oven to 350°F (175°C).\nButter a 4x8 inch loaf pan.\nMash the ripe bananas in a mixing bowl.',
      Mixing:
        'Stir melted butter into mashed bananas.\nMix in baking soda and salt.\nStir in sugar, beaten egg, and vanilla extract.\nAdd flour and mix until just incorporated.',
      Baking:
        'Pour batter into prepared loaf pan.\nBake for 50-60 minutes until a tester inserted into the center comes out clean.',
      Cooling:
        'Cool in pan for 10 minutes.\nRemove from pan and cool completely on a wire rack before slicing.',
    },
    tags: ['Dessert', 'Breakfast', 'Vegetarian'],
  },
  {
    name: 'Chocolate Chip Cookies',
    templateName: 'Baking',
    cookTimeMin: 35,
    servings: 24,
    favorite: true,
    imageUrl:
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    imageWidth: 900,
    imageHeight: 600,
    ingredients: [
      { name: 'all-purpose flour', amount: 2.25, unit: 'cup', orderIndex: 0 },
      { name: 'baking soda', amount: 1, unit: 'tsp', orderIndex: 1 },
      { name: 'salt', amount: 1, unit: 'tsp', orderIndex: 2 },
      { name: 'butter, softened', amount: 1, unit: 'cup', orderIndex: 3 },
      { name: 'granulated sugar', amount: 0.75, unit: 'cup', orderIndex: 4 },
      { name: 'packed brown sugar', amount: 0.75, unit: 'cup', orderIndex: 5 },
      { name: 'vanilla extract', amount: 1, unit: 'tsp', orderIndex: 6 },
      { name: 'large eggs', amount: 2, unit: '', orderIndex: 7 },
      { name: 'chocolate chips', amount: 2, unit: 'cup', orderIndex: 8 },
    ],
    sections: {
      Preparation:
        'Preheat oven to 375°F (190°C).\nCombine flour, baking soda, and salt in a small bowl.',
      Mixing:
        'Beat butter, granulated sugar, brown sugar, and vanilla extract in a large mixer bowl until creamy.\nAdd eggs one at a time, beating well after each addition.\nGradually beat in flour mixture.\nStir in chocolate chips.',
      Baking:
        'Drop by rounded tablespoon onto ungreased baking sheets.\nBake for 9 to 11 minutes or until golden brown.',
      Cooling:
        'Cool on baking sheets for 2 minutes.\nRemove to wire racks to cool completely.',
    },
    tags: ['Dessert', 'Kids', 'Classic'],
  },
  {
    name: 'Mapo Tofu',
    templateName: '中餐',
    cookTimeMin: 25,
    servings: 4,
    favorite: true,
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    imageWidth: 1080,
    imageHeight: 720,
    ingredients: [
      { name: 'soft tofu, cubed', amount: 1, unit: 'block', orderIndex: 0 },
      { name: 'ground pork', amount: 0.5, unit: 'lb', orderIndex: 1 },
      { name: 'doubanjiang (spicy bean paste)', amount: 2, unit: 'tbsp', orderIndex: 2 },
      { name: 'fermented black beans, rinsed', amount: 1, unit: 'tbsp', orderIndex: 3 },
      { name: 'Sichuan peppercorns, toasted and ground', amount: 1, unit: 'tsp', orderIndex: 4 },
      { name: 'chili oil', amount: 2, unit: 'tbsp', orderIndex: 5 },
      { name: 'chicken stock', amount: 1, unit: 'cup', orderIndex: 6 },
      { name: 'green onions, chopped', amount: 2, unit: '', orderIndex: 7 },
      { name: 'cornstarch mixed with 2 tbsp water', amount: 1, unit: 'tbsp', orderIndex: 8 },
    ],
    sections: {
      '料头':
        '嫩豆腐切1.5厘米见方的小块，放入淡盐水中浸泡5分钟去豆腥味。\n豆豉用清水冲洗一下，稍微切碎。\n青蒜或葱切成小段备用。',
      '料汁':
        '生抽2勺、老抽半勺、料酒1勺、白糖1勺、鸡精少许、花椒粉1勺、淀粉2勺加半碗水调成芡汁备用。',
      '烹饪':
        '热锅凉油，中小火将牛肉末炒散至变色。\n加入豆瓣酱炒出红油，再加入豆豉炒香。\n加入蒜末姜末爆香。\n倒入高汤或清水烧开。\n轻轻滑入豆腐块，用铲背轻推，中火煮3-4分钟让豆腐入味。\n分三次淋入芡汁，每次等汤汁浓稠后再加下一次。',
      '要点':
        '豆腐用淡盐水浸泡可去豆腥且不易碎。\n勾芡要分三次，这样汤汁才能均匀包裹豆腐。\n花椒粉最后撒，保持麻香。\n用牛肉末比猪肉更香，也可用素肉末代替。',
    },
    tags: ['Spicy', 'Sichuan', 'Authentic'],
  },
  {
    name: 'Simple Fried Rice',
    templateName: '中餐',
    cookTimeMin: 20,
    servings: 4,
    favorite: false,
    imageUrl:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    imageWidth: 1080,
    imageHeight: 720,
    ingredients: [
      { name: 'cooked rice, preferably day-old', amount: 3, unit: 'cup', orderIndex: 0 },
      { name: 'vegetable oil', amount: 2, unit: 'tbsp', orderIndex: 1 },
      { name: 'eggs, beaten', amount: 2, unit: '', orderIndex: 2 },
      { name: 'frozen peas and carrots', amount: 1, unit: 'cup', orderIndex: 3 },
      { name: 'green onions, sliced', amount: 2, unit: '', orderIndex: 4 },
      { name: 'soy sauce', amount: 2, unit: 'tbsp', orderIndex: 5 },
      { name: 'sesame oil', amount: 1, unit: 'tsp', orderIndex: 6 },
      { name: 'white pepper', amount: 0.5, unit: 'tsp', orderIndex: 7 },
    ],
    sections: {
      '料头':
        '隔夜米饭用筷子拨散，确保没有结块。\n鸡蛋打散成蛋液。\n葱切葱花，葱白和葱绿分开。',
      '料汁':
        '生抽2勺、蚝油1勺、白胡椒粉少许、盐少许调成料汁备用。',
      '烹饪':
        '热锅凉油，大火将蛋液快速炒散成蛋花，盛出备用。\n锅中再加少许油，先下葱白爆香。\n倒入米饭大火快炒，用铲背压散结块，炒2-3分钟至米粒跳动。\n加入冷冻蔬菜丁翻炒均匀。\n淋入调好的料汁，快速翻炒均匀。\n最后倒入蛋花，撒入葱绿，翻匀即可。',
      '要点':
        '用隔夜饭最佳，水分少才能粒粒分明。\n全程大火快炒，锅气足才香。\n料汁提前调好，避免炒的时候手忙脚乱。\n蛋花最后放，保持嫩滑口感。',
    },
    tags: ['Quick', 'Leftover', 'Easy'],
  },
  {
    name: '葱姜鸡焖饭',
    templateName: '中餐',
    cookTimeMin: 35,
    servings: 3,
    favorite: true,
    imageUrl:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    imageWidth: 1080,
    imageHeight: 720,
    ingredients: [
      { name: '鸡腿肉', amount: 300, unit: 'g', orderIndex: 0 },
      { name: '大米', amount: 2, unit: '杯', orderIndex: 1 },
      { name: '葱', amount: 3, unit: '根', orderIndex: 2 },
      { name: '姜', amount: 1, unit: '块', orderIndex: 3 },
      { name: '料酒', amount: 1, unit: '勺', orderIndex: 4 },
      { name: '生抽', amount: 2, unit: '勺', orderIndex: 5 },
      { name: '蚝油', amount: 1, unit: '勺', orderIndex: 6 },
      { name: '盐', amount: 0, unit: '适量', orderIndex: 7 },
      { name: '淀粉', amount: 1, unit: '勺', orderIndex: 8 },
      { name: '黑胡椒', amount: 0, unit: '少许', orderIndex: 9 },
      { name: '白糖', amount: 0, unit: '少许', orderIndex: 10 },
    ],
    sections: {
      '料头':
        '鸡肉切块，用料酒、生抽、蚝油、盐、淀粉、黑胡椒抓匀，腌制 10–15 分钟。\n葱切段，姜切丝备用。',
      '料汁':
        '腌制鸡肉的料汁保留备用。\n准备少许盐和白糖用于调制葱姜油。',
      '烹饪':
        '锅中放少许油，加入葱姜炒出香味。\n加入少许盐和白糖调成葱姜油，稍微翻炒均匀后关火。\n将洗净的米放入电饭煲，加入常规的米水比例。\n把腌好的鸡块均匀铺在米上，倒入事先调好的葱姜油。\n启动电饭煲普通煮饭模式，焖煮约 20–25 分钟至饭熟鸡肉全熟。\n炊好后轻轻翻动，使鸡肉与米饭充分混合。',
      '要点':
        '葱姜油提前炒香，可让整锅饭更具层次感。\n鸡肉腌制后带汁上锅，焖煮时更加入味。\n米水比例按常规煮饭即可，鸡肉会出少许汤汁。\n最后撒上葱花增香点缀。',
    },
    tags: ['主食', '家常', '电饭煲'],
  },
];

export async function seedDatabase(): Promise<void> {
  try {
    await initDatabase();
    const db = await getDatabase();

    // Clear existing data (optional - comment out if you want to keep existing data)
    await db.execAsync(`
      DELETE FROM recipe_tags;
      DELETE FROM recipe_sections;
      DELETE FROM recipe_ingredients;
      DELETE FROM recipes;
      DELETE FROM template_sections;
      DELETE FROM templates;
      DELETE FROM tags;
    `);

    // Insert Templates and their Sections
    const templateIdMap = new Map<string, string>(); // name -> id

    for (const template of DEFAULT_TEMPLATES) {
      const templateId = generateId();
      templateIdMap.set(template.name, templateId);

      const timestamp = now();

      await db.runAsync(
        `INSERT INTO templates (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        [templateId, template.name, timestamp, timestamp]
      );

      // Insert sections for this template
      for (let i = 0; i < template.sections.length; i++) {
        const sectionId = generateId();
        const sectionName = template.sections[i];

        await db.runAsync(
          `INSERT INTO template_sections (id, template_id, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
          [sectionId, templateId, sectionName, i, timestamp, timestamp]
        );
      }
    }

    // Insert Recipes
    for (const recipe of DUMMY_RECIPES) {
      const templateId = templateIdMap.get(recipe.templateName);
      if (!templateId) continue;

      const recipeId = generateId();
      const timestamp = now();

      await db.runAsync(
        `INSERT INTO recipes (
          id, name, cook_time_min, servings, favorite,
          image_url, image_width, image_height, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recipeId,
          recipe.name,
          recipe.cookTimeMin ?? null,
          recipe.servings ?? null,
          recipe.favorite ? 1 : 0,
          recipe.imageUrl ?? null,
          recipe.imageWidth ?? null,
          recipe.imageHeight ?? null,
          timestamp,
          timestamp,
        ]
      );

      // Insert ingredients
      for (const ingredient of recipe.ingredients) {
        const ingredientId = generateId();
        await db.runAsync(
          `INSERT INTO recipe_ingredients (id, recipe_id, name, amount, unit, order_index) VALUES (?, ?, ?, ?, ?, ?)`,
          [ingredientId, recipeId, ingredient.name, ingredient.amount ?? null, ingredient.unit ?? null, ingredient.orderIndex]
        );
      }

      // Insert sections
      const template = DEFAULT_TEMPLATES.find((t) => t.name === recipe.templateName);
      const sectionOrder = template?.sections ?? Object.keys(recipe.sections);
      for (const sectionName of sectionOrder) {
        const content = recipe.sections[sectionName];
        if (!content) continue;

        const sectionId = generateId();
        await db.runAsync(
          `INSERT INTO recipe_sections (id, recipe_id, name, content, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
          [sectionId, recipeId, sectionName, content, timestamp]
        );
      }

      // Insert tags
      if (recipe.tags) {
        for (const tagName of recipe.tags) {
          // Check if tag exists
          const existingTag = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM tags WHERE name = ? COLLATE NOCASE',
            [tagName]
          );

          let tagId: string;
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            tagId = generateId();
            await db.runAsync('INSERT INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);
          }

          await db.runAsync('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [
            recipeId,
            tagId,
          ]);
        }
      }
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
