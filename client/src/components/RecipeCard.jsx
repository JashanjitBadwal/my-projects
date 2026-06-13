import { Link } from 'react-router-dom';
import { categoryEmoji } from '../utils/categoryEmoji';

// Summary card shown in recipe grids (browse/favorites/my recipes lists).
export default function RecipeCard({ recipe, onToggleFavorite, canFavorite }) {
  return (
    <div className="recipe-card">
      <div className="recipe-card-header">
        <h3>
          <span className="category-emoji">{categoryEmoji(recipe.category)}</span>
          <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
        </h3>
        {canFavorite && (
          <button
            className={`favorite-button ${recipe.isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(recipe)}
            title={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {recipe.isFavorite ? '★' : '☆'}
          </button>
        )}
      </div>
      {recipe.description && <p className="recipe-description">{recipe.description}</p>}
      <div className="recipe-meta">
        {recipe.category && <span className="badge">{recipe.category}</span>}
        {recipe.prepTimeMinutes && <span className="badge">⏱ {recipe.prepTimeMinutes} min</span>}
        <span className="badge subtle">by {recipe.authorName}</span>
      </div>
    </div>
  );
}
