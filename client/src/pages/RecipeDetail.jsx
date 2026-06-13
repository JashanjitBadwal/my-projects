import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function RecipeDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getRecipe(id, token)
      .then(setRecipe)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  async function toggleFavorite() {
    try {
      if (recipe.isFavorite) {
        await api.removeFavorite(recipe.id, token);
      } else {
        await api.addFavorite(recipe.id, token);
      }
      setRecipe((r) => ({ ...r, isFavorite: !r.isFavorite }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this recipe? This cannot be undone.')) return;
    try {
      await api.deleteRecipe(recipe.id, token);
      navigate('/my-recipes');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!recipe) return <p>Recipe not found.</p>;

  const isOwner = user && user.id === recipe.userId;

  return (
    <div className="recipe-detail">
      <div className="recipe-detail-header">
        <h2>{recipe.title}</h2>
        {user && (
          <button
            className={`favorite-button ${recipe.isFavorite ? 'active' : ''}`}
            onClick={toggleFavorite}
          >
            {recipe.isFavorite ? '★ Favorited' : '☆ Add to favorites'}
          </button>
        )}
      </div>

      <div className="recipe-meta">
        {recipe.category && <span className="badge">{recipe.category}</span>}
        {recipe.prepTimeMinutes && <span className="badge">{recipe.prepTimeMinutes} min</span>}
        <span className="badge subtle">by {recipe.authorName}</span>
      </div>

      {recipe.description && <p className="recipe-description">{recipe.description}</p>}

      <h3>Ingredients</h3>
      <ul>
        {recipe.ingredients.map((ing, i) => (
          <li key={i}>{ing}</li>
        ))}
      </ul>

      <h3>Steps</h3>
      <ol>
        {recipe.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>

      {isOwner && (
        <div className="recipe-actions">
          <Link to={`/recipes/${recipe.id}/edit`} className="button">
            Edit
          </Link>
          <button className="button danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
