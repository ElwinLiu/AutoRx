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
    name: 'Chinese Food',
    sections: ['Prep & Marinate', 'Prepare Aromatics', 'Cooking', 'Finishing'],
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
    templateName: 'Chinese Food',
    cookTimeMin: 30,
    servings: 4,
    favorite: true,
    imageUrl:
      'https://images.unsplash.com/photo-1605704922285-e82455dba38b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    imageWidth: 1080,
    imageHeight: 720,
    ingredients: [
      { text: '1.5 lb boneless chicken thighs, cut into bite-sized pieces', orderIndex: 0 },
      { text: '2 tbsp soy sauce', orderIndex: 1 },
      { text: '1 tbsp cornstarch', orderIndex: 2 },
      { text: '8 dried red chilies', orderIndex: 3 },
      { text: '1 tsp Sichuan peppercorns', orderIndex: 4 },
      { text: '1/2 cup roasted peanuts', orderIndex: 5 },
      { text: '3 green onions, sliced', orderIndex: 6 },
      { text: '4 cloves garlic, minced', orderIndex: 7 },
      { text: '1 tbsp ginger, minced', orderIndex: 8 },
    ],
    sections: {
      'Prep & Marinate':
        'Cut chicken into bite-sized pieces.\nCombine chicken with soy sauce and cornstarch. Marinate for 15 minutes.',
      'Prepare Aromatics':
        'Mince garlic and ginger.\nSlice green onions, separating whites and greens.',
      Cooking:
        'Heat oil in a wok over high heat.\nAdd chilies and peppercorns, stir-fry until fragrant.\nAdd marinated chicken and stir-fry until just cooked.\nAdd aromatics and stir-fry for 1 minute.\nToss in peanuts and green onions. Stir to combine.',
      Finishing: 'Transfer to a serving plate.\nServe immediately with steamed rice.',
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
      { text: '3 ripe bananas, mashed', orderIndex: 0 },
      { text: '1/3 cup melted butter', orderIndex: 1 },
      { text: '1 tsp baking soda', orderIndex: 2 },
      { text: 'Pinch of salt', orderIndex: 3 },
      { text: '3/4 cup sugar', orderIndex: 4 },
      { text: '1 large egg, beaten', orderIndex: 5 },
      { text: '1 tsp vanilla extract', orderIndex: 6 },
      { text: '1 1/2 cups all-purpose flour', orderIndex: 7 },
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
      { text: '2 1/4 cups all-purpose flour', orderIndex: 0 },
      { text: '1 tsp baking soda', orderIndex: 1 },
      { text: '1 tsp salt', orderIndex: 2 },
      { text: '1 cup butter, softened', orderIndex: 3 },
      { text: '3/4 cup granulated sugar', orderIndex: 4 },
      { text: '3/4 cup packed brown sugar', orderIndex: 5 },
      { text: '1 tsp vanilla extract', orderIndex: 6 },
      { text: '2 large eggs', orderIndex: 7 },
      { text: '2 cups chocolate chips', orderIndex: 8 },
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
    templateName: 'Chinese Food',
    cookTimeMin: 25,
    servings: 4,
    favorite: true,
    imageUrl:
      'https://images.unsplash.com/photo-1541544537156-21c5299228d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    imageWidth: 1080,
    imageHeight: 720,
    ingredients: [
      { text: '1 block soft tofu, cubed', orderIndex: 0 },
      { text: '1/2 lb ground pork', orderIndex: 1 },
      { text: '2 tbsp doubanjiang (spicy bean paste)', orderIndex: 2 },
      { text: '1 tbsp fermented black beans, rinsed', orderIndex: 3 },
      { text: '1 tsp Sichuan peppercorns, toasted and ground', orderIndex: 4 },
      { text: '2 tbsp chili oil', orderIndex: 5 },
      { text: '1 cup chicken stock', orderIndex: 6 },
      { text: '2 green onions, chopped', orderIndex: 7 },
      { text: '1 tbsp cornstarch mixed with 2 tbsp water', orderIndex: 8 },
    ],
    sections: {
      'Prep & Marinate':
        'Cut tofu into 1-inch cubes and place in a bowl of hot water to remove excess water.\nRinse fermented black beans.',
      'Prepare Aromatics':
        'Toast Sichuan peppercorns in a dry pan until fragrant, then grind.\nChop green onions.',
      Cooking:
        'Heat chili oil in a wok over medium heat.\nAdd ground pork and cook until no longer pink.\nAdd doubanjiang and fermented black beans, stir-fry for 1 minute.\nAdd chicken stock and bring to a simmer.\nGently slide in tofu cubes and simmer for 3-4 minutes.\nPour in cornstarch slurry to thicken the sauce.',
      Finishing:
        'Sprinkle with ground Sichuan peppercorns.\nGarnish with green onions.\nServe hot with steamed rice.',
    },
    tags: ['Spicy', 'Sichuan', 'Authentic'],
  },
  {
    name: 'Simple Fried Rice',
    templateName: 'Chinese Food',
    cookTimeMin: 20,
    servings: 4,
    favorite: false,
    ingredients: [
      { text: '3 cups cooked rice, preferably day-old', orderIndex: 0 },
      { text: '2 tbsp vegetable oil', orderIndex: 1 },
      { text: '2 eggs, beaten', orderIndex: 2 },
      { text: '1 cup frozen peas and carrots', orderIndex: 3 },
      { text: '2 green onions, sliced', orderIndex: 4 },
      { text: '2 tbsp soy sauce', orderIndex: 5 },
      { text: '1 tsp sesame oil', orderIndex: 6 },
      { text: '1/2 tsp white pepper', orderIndex: 7 },
    ],
    sections: {
      'Prep & Marinate':
        'Break up any clumps in the cold rice.\nBeat eggs in a small bowl.',
      'Prepare Aromatics': 'Slice green onions, separating whites and greens.',
      Cooking:
        'Heat 1 tbsp oil in a wok over high heat.\nScramble eggs quickly and remove from pan.\nAdd remaining oil and stir-fry vegetables for 1 minute.\nAdd rice and stir-fry, breaking up clumps, for 2-3 minutes.\nAdd soy sauce, sesame oil, and white pepper.\nReturn eggs to pan and toss to combine.',
      Finishing: 'Garnish with green onions.\nServe immediately.',
    },
    tags: ['Quick', 'Leftover', 'Easy'],
  },
];

export async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seed...');

  try {
    await initDatabase();
    const db = await getDatabase();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await db.execAsync(`
      DELETE FROM recipe_tags;
      DELETE FROM tags;
      DELETE FROM recipe_sections;
      DELETE FROM recipe_ingredients;
      DELETE FROM recipes;
      DELETE FROM template_sections;
      DELETE FROM templates;
    `);

    // Insert Templates and their Sections
    console.log('📋 Inserting templates...');
    const templateIdMap = new Map<string, string>(); // name -> id
    const templateSectionIdMap = new Map<string, Map<string, string>>(); // templateName -> (sectionName -> id)

    for (const template of DEFAULT_TEMPLATES) {
      const templateId = generateId();
      templateIdMap.set(template.name, templateId);
      templateSectionIdMap.set(template.name, new Map());

      const timestamp = now();

      await db.runAsync(
        `INSERT INTO templates (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        [templateId, template.name, timestamp, timestamp]
      );

      // Insert sections for this template
      for (let i = 0; i < template.sections.length; i++) {
        const sectionId = generateId();
        const sectionName = template.sections[i];
        templateSectionIdMap.get(template.name)!.set(sectionName, sectionId);

        await db.runAsync(
          `INSERT INTO template_sections (id, template_id, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
          [sectionId, templateId, sectionName, i, timestamp, timestamp]
        );
      }
    }

    console.log(`✅ Inserted ${DEFAULT_TEMPLATES.length} templates`);

    // Insert Recipes
    console.log('🍳 Inserting recipes...');

    for (const recipe of DUMMY_RECIPES) {
      const templateId = templateIdMap.get(recipe.templateName);
      if (!templateId) {
        console.warn(`⚠️ Template not found for recipe: ${recipe.name}`);
        continue;
      }

      const recipeId = generateId();
      const timestamp = now();

      await db.runAsync(
        `INSERT INTO recipes (
          id, template_id, name, cook_time_min, servings, favorite,
          image_url, image_width, image_height, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recipeId,
          templateId,
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
          `INSERT INTO recipe_ingredients (id, recipe_id, order_index, text) VALUES (?, ?, ?, ?)`,
          [ingredientId, recipeId, ingredient.orderIndex, ingredient.text]
        );
      }

      // Insert sections
      const sectionIdMap = templateSectionIdMap.get(recipe.templateName)!;
      for (const [sectionName, content] of Object.entries(recipe.sections)) {
        const templateSectionId = sectionIdMap.get(sectionName);
        if (!templateSectionId) {
          console.warn(`⚠️ Section not found: ${sectionName} in template ${recipe.templateName}`);
          continue;
        }

        const sectionId = generateId();
        await db.runAsync(
          `INSERT INTO recipe_sections (id, recipe_id, template_section_id, content, updated_at) VALUES (?, ?, ?, ?, ?)`,
          [sectionId, recipeId, templateSectionId, content, timestamp]
        );
      }

      // Insert tags
      if (recipe.tags) {
        for (const tagName of recipe.tags) {
          // Check if tag exists
          const existingTag = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM tags WHERE name = ?',
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

    console.log(`✅ Inserted ${DUMMY_RECIPES.length} recipes`);

    console.log('🎉 Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
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
