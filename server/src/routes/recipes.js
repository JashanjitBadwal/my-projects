// Recipe routes: listing/searching, CRUD, and favorites.
import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Convert a raw DB row (with JSON-encoded ingredients/steps) into the
// shape returned by the API, including whether the current user has
// favorited it.
function serializeRecipe(row, favoriteRecipeIds) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    ingredients: JSON.parse(row.ingredients),
    steps: JSON.parse(row.steps),
    category: row.category,
    prepTimeMinutes: row.prep_time_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.author_name,
    isFavorite: favoriteRecipeIds ? favoriteRecipeIds.has(row.id) : false,
  };
}

// Get the set of recipe ids the given user has favorited.
function getFavoriteIds(userId) {
  if (!userId) return new Set();
  const rows = db.prepare('SELECT recipe_id FROM favorites WHERE user_id = ?').all(userId);
  return new Set(rows.map((r) => r.recipe_id));
}

// Optional auth: attaches req.user if a valid token is present, but doesn't require one.
// Used on public endpoints (browsing recipes) that still need to know the
// current user for things like "isFavorite".
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      req.user = { id: payload.userId, email: payload.email, name: payload.name };
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

// GET /api/recipes - list recipes, with optional filters:
//   ?search=    matches title or description
//   ?category=  exact category match
//   ?mine=true  only the current user's recipes (requires auth)
//   ?favorites=true  only recipes the current user has favorited (requires auth)
router.get('/', optionalAuth, (req, res) => {
  const { search, category, mine, favorites } = req.query;

  let query = `
    SELECT recipes.*, users.name AS author_name
    FROM recipes
    JOIN users ON users.id = recipes.user_id
  `;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(recipes.title LIKE ? OR recipes.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    conditions.push('recipes.category = ?');
    params.push(category);
  }

  if (mine === 'true') {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    conditions.push('recipes.user_id = ?');
    params.push(req.user.id);
  }

  if (favorites === 'true') {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    conditions.push('recipes.id IN (SELECT recipe_id FROM favorites WHERE user_id = ?)');
    params.push(req.user.id);
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY recipes.created_at DESC';

  const rows = db.prepare(query).all(...params);
  const favoriteIds = req.user ? getFavoriteIds(req.user.id) : new Set();

  res.json(rows.map((row) => serializeRecipe(row, favoriteIds)));
});

// GET /api/recipes/categories - list all distinct categories in use,
// for populating the category filter dropdown on the frontend.
router.get('/categories', (_req, res) => {
  const rows = db
    .prepare('SELECT DISTINCT category FROM recipes WHERE category IS NOT NULL AND category != "" ORDER BY category')
    .all();
  res.json(rows.map((r) => r.category));
});

// GET /api/recipes/:id - fetch a single recipe by id.
router.get('/:id', optionalAuth, (req, res) => {
  const row = db
    .prepare(
      `SELECT recipes.*, users.name AS author_name
       FROM recipes JOIN users ON users.id = recipes.user_id
       WHERE recipes.id = ?`
    )
    .get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Recipe not found' });

  const favoriteIds = req.user ? getFavoriteIds(req.user.id) : new Set();
  res.json(serializeRecipe(row, favoriteIds));
});

// POST /api/recipes - create a new recipe owned by the authenticated user.
router.post('/', requireAuth, (req, res) => {
  const { title, description, ingredients, steps, category, prepTimeMinutes } = req.body;

  if (!title || !Array.isArray(ingredients) || !ingredients.length || !Array.isArray(steps) || !steps.length) {
    return res.status(400).json({ error: 'title, ingredients (array), and steps (array) are required' });
  }

  const result = db
    .prepare(
      `INSERT INTO recipes (user_id, title, description, ingredients, steps, category, prep_time_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      title,
      description || null,
      JSON.stringify(ingredients),
      JSON.stringify(steps),
      category || null,
      prepTimeMinutes ? Number(prepTimeMinutes) : null
    );

  const row = db
    .prepare(
      `SELECT recipes.*, users.name AS author_name
       FROM recipes JOIN users ON users.id = recipes.user_id
       WHERE recipes.id = ?`
    )
    .get(result.lastInsertRowid);

  res.status(201).json(serializeRecipe(row, new Set()));
});

// PUT /api/recipes/:id - update a recipe. Only the owning user can edit it.
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Recipe not found' });
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own recipes' });
  }

  const { title, description, ingredients, steps, category, prepTimeMinutes } = req.body;

  if (!title || !Array.isArray(ingredients) || !ingredients.length || !Array.isArray(steps) || !steps.length) {
    return res.status(400).json({ error: 'title, ingredients (array), and steps (array) are required' });
  }

  db.prepare(
    `UPDATE recipes
     SET title = ?, description = ?, ingredients = ?, steps = ?, category = ?, prep_time_minutes = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    title,
    description || null,
    JSON.stringify(ingredients),
    JSON.stringify(steps),
    category || null,
    prepTimeMinutes ? Number(prepTimeMinutes) : null,
    req.params.id
  );

  const row = db
    .prepare(
      `SELECT recipes.*, users.name AS author_name
       FROM recipes JOIN users ON users.id = recipes.user_id
       WHERE recipes.id = ?`
    )
    .get(req.params.id);

  res.json(serializeRecipe(row, getFavoriteIds(req.user.id)));
});

// DELETE /api/recipes/:id - delete a recipe. Only the owning user can delete it.
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Recipe not found' });
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own recipes' });
  }

  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// POST /api/recipes/:id/favorite - mark a recipe as a favorite for the current user.
router.post('/:id/favorite', requireAuth, (req, res) => {
  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

  // INSERT OR IGNORE so re-favoriting an already-favorited recipe is a no-op.
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)').run(
    req.user.id,
    req.params.id
  );

  res.status(204).end();
});

// DELETE /api/recipes/:id/favorite - remove a recipe from the current user's favorites.
router.delete('/:id/favorite', requireAuth, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?').run(
    req.user.id,
    req.params.id
  );
  res.status(204).end();
});

export default router;
