import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import RecipeCard from '../components/RecipeCard';

// Recipe listing page, reused for three views depending on `mode`:
//   undefined  -> browse all recipes (with search/category filters)
//   'favorites' -> the current user's favorited recipes
//   'mine'      -> recipes created by the current user
export default function RecipeList({ mode }) {
  const { token, user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch recipes from the API based on the current mode and filters.
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { search, category };
      if (mode === 'favorites') params.favorites = 'true';
      if (mode === 'mine') params.mine = 'true';
      const data = await api.getRecipes(params, token);
      setRecipes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, mode, token]);

  // Re-fetch whenever the search/category/mode/token changes.
  useEffect(() => {
    load();
  }, [load]);

  // Load the list of categories once, for the filter dropdown.
  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Add or remove the recipe from the current user's favorites, updating
  // local state optimistically (and removing it from the favorites view
  // immediately once un-favorited).
  async function toggleFavorite(recipe) {
    try {
      if (recipe.isFavorite) {
        await api.removeFavorite(recipe.id, token);
      } else {
        await api.addFavorite(recipe.id, token);
      }
      setRecipes((prev) =>
        prev
          .map((r) => (r.id === recipe.id ? { ...r, isFavorite: !r.isFavorite } : r))
          .filter((r) => mode !== 'favorites' || r.isFavorite)
      );
    } catch (err) {
      setError(err.message);
    }
  }

  const title =
    mode === 'favorites' ? 'My Favorites' : mode === 'mine' ? 'My Recipes' : 'Browse Recipes';

  return (
    <div>
      <h2>{title}</h2>
      {mode !== 'mine' && mode !== 'favorites' && (
        <div className="filters">
          <input
            type="search"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : recipes.length === 0 ? (
        <p>No recipes found.</p>
      ) : (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              canFavorite={!!user}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
