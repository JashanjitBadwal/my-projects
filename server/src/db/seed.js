// Seed script: populates the database with a demo user and a set of
// sample recipes (desserts plus a few popular main dishes/appetizers).
// Run with `npm run seed`.
import bcrypt from 'bcryptjs';
import db from './index.js';

// Create (or reuse) a demo user that will "own" the seeded recipes.
const seedEmail = 'chef@example.com';
const seedName = 'Demo Chef';

let user = db.prepare('SELECT * FROM users WHERE email = ?').get(seedEmail);

if (!user) {
  const passwordHash = bcrypt.hashSync('password123', 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
    .run(seedEmail, passwordHash, seedName);
  user = { id: result.lastInsertRowid, email: seedEmail, name: seedName };
  console.log(`Created seed user "${seedName}" (${seedEmail} / password123)`);
} else {
  console.log(`Using existing seed user "${seedName}" (${seedEmail})`);
}

// List of recipes to insert, each with ingredients and steps.
const seedRecipes = [
  {
    title: 'Classic Chocolate Cake',
    description: 'A rich, moist chocolate cake perfect for celebrations.',
    category: 'Dessert',
    prepTimeMinutes: 60,
    ingredients: [
      '2 cups all-purpose flour',
      '2 cups sugar',
      '3/4 cup cocoa powder',
      '2 tsp baking soda',
      '1 tsp baking powder',
      '1 tsp salt',
      '2 eggs',
      '1 cup buttermilk',
      '1 cup vegetable oil',
      '2 tsp vanilla extract',
      '1 cup hot coffee',
    ],
    steps: [
      'Preheat oven to 350°F (175°C) and grease two 9-inch cake pans.',
      'Whisk together flour, sugar, cocoa, baking soda, baking powder, and salt.',
      'Add eggs, buttermilk, oil, and vanilla, and mix until combined.',
      'Stir in hot coffee until the batter is smooth and thin.',
      'Divide batter between pans and bake for 30-35 minutes.',
      'Cool completely before frosting.',
    ],
  },
  {
    title: 'Gulab Jamun',
    description: 'Soft, syrup-soaked milk dumplings, a classic Indian sweet.',
    category: 'Dessert',
    prepTimeMinutes: 45,
    ingredients: [
      '1 cup milk powder',
      '1/4 cup all-purpose flour',
      '1/4 tsp baking soda',
      '2 tbsp ghee',
      '2-3 tbsp milk (to bind)',
      '2 cups sugar',
      '2 cups water',
      '4-5 green cardamom pods',
      'A few strands of saffron',
      'Oil or ghee for frying',
    ],
    steps: [
      'Make the sugar syrup by boiling sugar, water, cardamom, and saffron for 8-10 minutes; set aside.',
      'Mix milk powder, flour, and baking soda, then rub in ghee.',
      'Add milk gradually to form a soft dough.',
      'Shape the dough into smooth, crack-free balls.',
      'Fry the balls on low-medium heat until golden brown.',
      'Soak the fried balls in warm sugar syrup for at least 1 hour before serving.',
    ],
  },
  {
    title: 'Classic Tiramisu',
    description: 'A no-bake Italian dessert with espresso-soaked ladyfingers and mascarpone cream.',
    category: 'Dessert',
    prepTimeMinutes: 30,
    ingredients: [
      '6 egg yolks',
      '3/4 cup sugar',
      '2 cups mascarpone cheese',
      '1 1/2 cups heavy cream',
      '2 cups strong brewed espresso, cooled',
      '2 packages ladyfinger cookies',
      'Cocoa powder for dusting',
    ],
    steps: [
      'Whisk egg yolks and sugar over a double boiler until thick and pale.',
      'Fold in mascarpone cheese until smooth.',
      'In a separate bowl, whip the heavy cream to stiff peaks and fold into the mascarpone mixture.',
      'Quickly dip ladyfingers in espresso and layer them in a dish.',
      'Spread half the mascarpone cream over the ladyfingers, then repeat with another layer.',
      'Dust with cocoa powder and refrigerate for at least 4 hours before serving.',
    ],
  },
  {
    title: 'Apple Pie',
    description: 'A homemade apple pie with a flaky crust and warmly spiced filling.',
    category: 'Dessert',
    prepTimeMinutes: 90,
    ingredients: [
      '2 pie crusts (top and bottom)',
      '6 cups thinly sliced apples',
      '3/4 cup sugar',
      '2 tbsp all-purpose flour',
      '1 tsp cinnamon',
      '1/4 tsp nutmeg',
      '1/4 tsp salt',
      '1 tbsp lemon juice',
      '2 tbsp butter, cut into small pieces',
      '1 egg, beaten (for egg wash)',
    ],
    steps: [
      'Preheat oven to 375°F (190°C) and line a pie dish with one crust.',
      'Toss apples with sugar, flour, cinnamon, nutmeg, salt, and lemon juice.',
      'Pour the apple mixture into the crust and dot with butter.',
      'Cover with the second crust, seal and crimp the edges, and cut slits for venting.',
      'Brush the top crust with egg wash.',
      'Bake for 45-50 minutes until the crust is golden and the filling is bubbling.',
      'Cool for at least 2 hours before slicing.',
    ],
  },
  {
    title: 'Fudgy Brownies',
    description: 'Dense, fudgy chocolate brownies with a crackly top.',
    category: 'Dessert',
    prepTimeMinutes: 40,
    ingredients: [
      '1/2 cup unsalted butter',
      '1 cup sugar',
      '1/3 cup cocoa powder',
      '2 eggs',
      '1 tsp vanilla extract',
      '1/2 cup all-purpose flour',
      '1/4 tsp salt',
      '1/4 tsp baking powder',
      '1/2 cup chocolate chips',
    ],
    steps: [
      'Preheat oven to 350°F (175°C) and line an 8x8-inch pan with parchment paper.',
      'Melt butter, then stir in sugar and cocoa powder.',
      'Beat in eggs one at a time, then add vanilla extract.',
      'Fold in flour, salt, and baking powder until just combined.',
      'Stir in chocolate chips and pour batter into the pan.',
      'Bake for 25-30 minutes, then cool before cutting into squares.',
    ],
  },
  {
    title: 'Mango Lassi Popsicles',
    description: 'A frozen twist on the classic mango lassi - creamy, fruity, and refreshing.',
    category: 'Dessert',
    prepTimeMinutes: 15,
    ingredients: [
      '2 cups ripe mango chunks',
      '1 cup plain yogurt',
      '1/2 cup milk',
      '3 tbsp honey or sugar',
      '1/4 tsp ground cardamom',
      'A pinch of salt',
    ],
    steps: [
      'Blend mango, yogurt, milk, honey, cardamom, and salt until smooth.',
      'Taste and adjust sweetness if needed.',
      'Pour the mixture into popsicle molds.',
      'Insert popsicle sticks and freeze for at least 6 hours, or overnight.',
      'Run molds under warm water briefly to release the popsicles before serving.',
    ],
  },
  {
    title: 'Butter Chicken',
    description: 'Tender chicken simmered in a rich, creamy tomato-based curry.',
    category: 'Dinner',
    prepTimeMinutes: 50,
    ingredients: [
      '500g boneless chicken thighs, cut into chunks',
      '1 cup plain yogurt',
      '1 tbsp ginger-garlic paste',
      '1 tsp turmeric powder',
      '1 tsp red chili powder',
      '2 tbsp butter',
      '1 tbsp oil',
      '1 large onion, finely chopped',
      '1 tbsp ginger-garlic paste (for the sauce)',
      '400g tomato puree',
      '1/2 cup heavy cream',
      '1 tsp garam masala',
      '1 tsp sugar',
      'Salt to taste',
      'Fresh cilantro for garnish',
    ],
    steps: [
      'Marinate the chicken in yogurt, ginger-garlic paste, turmeric, chili powder, and salt for at least 30 minutes.',
      'Cook the marinated chicken in a hot pan until browned and cooked through; set aside.',
      'In the same pan, melt butter with oil and sauté the onion until golden.',
      'Add ginger-garlic paste and cook for a minute, then stir in the tomato puree.',
      'Simmer the sauce for 10-15 minutes until thickened, then blend until smooth if desired.',
      'Return the chicken to the pan, stir in cream, garam masala, and sugar, and simmer for 10 minutes.',
      'Garnish with fresh cilantro and serve with rice or naan.',
    ],
  },
  {
    title: 'Chicken 65',
    description: 'Spicy, deep-fried Indian chicken bites with a tangy, peppery kick.',
    category: 'Appetizer',
    prepTimeMinutes: 40,
    ingredients: [
      '500g boneless chicken, cut into bite-sized pieces',
      '1 tbsp ginger-garlic paste',
      '1 tbsp lemon juice',
      '1/2 cup yogurt',
      '2 tsp red chili powder',
      '1/2 tsp turmeric powder',
      '1/2 cup cornstarch',
      '2 tbsp all-purpose flour',
      '1 egg',
      'Oil for deep frying',
      '2 tbsp oil (for tempering)',
      '1 tsp mustard seeds',
      '8-10 curry leaves',
      '2-3 dried red chilies',
      '2 green chilies, slit',
      'Salt to taste',
    ],
    steps: [
      'Marinate the chicken with ginger-garlic paste, lemon juice, yogurt, chili powder, turmeric, and salt for 30 minutes.',
      'Mix in cornstarch, flour, and egg to form a thick batter coating the chicken.',
      'Deep fry the chicken pieces in batches until golden and crispy; drain on paper towels.',
      'Heat 2 tbsp oil in a pan and add mustard seeds, curry leaves, dried red chilies, and green chilies.',
      'Toss the fried chicken in the tempered oil and spices until well coated.',
      'Serve hot as an appetizer or snack.',
    ],
  },
  {
    title: 'Crème Brûlée',
    description: 'A classic French dessert with silky vanilla custard and a crisp caramelized sugar top.',
    category: 'Dessert',
    prepTimeMinutes: 50,
    ingredients: [
      '2 cups heavy cream',
      '1 vanilla bean (or 1 tsp vanilla extract)',
      '5 large egg yolks',
      '1/2 cup sugar, plus extra for topping',
      'A pinch of salt',
    ],
    steps: [
      'Preheat oven to 325°F (165°C).',
      'Heat the cream with the vanilla bean (or extract) until just simmering, then remove from heat.',
      'Whisk egg yolks, sugar, and salt together until pale.',
      'Slowly pour the warm cream into the egg mixture, whisking constantly to avoid curdling.',
      'Strain the mixture and divide it among ramekins.',
      'Place ramekins in a baking dish, add hot water halfway up the sides, and bake for 30-35 minutes until just set.',
      'Chill the custards for at least 2 hours, then sprinkle sugar on top and caramelize with a kitchen torch (or broiler) just before serving.',
    ],
  },
];

// Prepared statement for inserting a recipe.
const insertRecipe = db.prepare(`
  INSERT INTO recipes (user_id, title, description, ingredients, steps, category, prep_time_minutes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Avoid inserting duplicates if the seed script is run more than once.
const existsByTitle = db.prepare('SELECT id FROM recipes WHERE title = ? AND user_id = ?');

let inserted = 0;
for (const recipe of seedRecipes) {
  const existing = existsByTitle.get(recipe.title, user.id);
  if (existing) continue;

  insertRecipe.run(
    user.id,
    recipe.title,
    recipe.description,
    JSON.stringify(recipe.ingredients),
    JSON.stringify(recipe.steps),
    recipe.category,
    recipe.prepTimeMinutes
  );
  inserted += 1;
}

console.log(`Seeded ${inserted} new recipe(s).`);
