import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const emptyRecipe = {
  title: '',
  description: '',
  category: '',
  prepTimeMinutes: '',
  ingredients: [''],
  steps: [''],
};

export default function RecipeForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyRecipe);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api
      .getRecipe(id, token)
      .then((recipe) =>
        setForm({
          title: recipe.title,
          description: recipe.description || '',
          category: recipe.category || '',
          prepTimeMinutes: recipe.prepTimeMinutes || '',
          ingredients: recipe.ingredients,
          steps: recipe.steps,
        })
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit, token]);

  function updateListItem(field, index, value) {
    setForm((f) => {
      const list = [...f[field]];
      list[index] = value;
      return { ...f, [field]: list };
    });
  }

  function addListItem(field) {
    setForm((f) => ({ ...f, [field]: [...f[field], ''] }));
  }

  function removeListItem(field, index) {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      prepTimeMinutes: form.prepTimeMinutes ? Number(form.prepTimeMinutes) : null,
      ingredients: form.ingredients.map((i) => i.trim()).filter(Boolean),
      steps: form.steps.map((s) => s.trim()).filter(Boolean),
    };

    try {
      const result = isEdit
        ? await api.updateRecipe(id, payload, token)
        : await api.createRecipe(payload, token);
      navigate(`/recipes/${result.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="form-page">
      <h2>{isEdit ? 'Edit Recipe' : 'Add Recipe'}</h2>
      <form onSubmit={handleSubmit} className="form">
        {error && <div className="error-banner">{error}</div>}

        <label>
          Title
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
          />
        </label>

        <div className="form-row">
          <label>
            Category
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. Dessert"
            />
          </label>

          <label>
            Prep time (minutes)
            <input
              type="number"
              min="0"
              value={form.prepTimeMinutes}
              onChange={(e) => setForm((f) => ({ ...f, prepTimeMinutes: e.target.value }))}
            />
          </label>
        </div>

        <fieldset>
          <legend>Ingredients</legend>
          {form.ingredients.map((ing, i) => (
            <div className="list-row" key={i}>
              <input
                type="text"
                value={ing}
                onChange={(e) => updateListItem('ingredients', i, e.target.value)}
                placeholder={`Ingredient ${i + 1}`}
                required
              />
              {form.ingredients.length > 1 && (
                <button type="button" onClick={() => removeListItem('ingredients', i)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addListItem('ingredients')}>
            + Add ingredient
          </button>
        </fieldset>

        <fieldset>
          <legend>Steps</legend>
          {form.steps.map((step, i) => (
            <div className="list-row" key={i}>
              <textarea
                value={step}
                onChange={(e) => updateListItem('steps', i, e.target.value)}
                placeholder={`Step ${i + 1}`}
                rows={2}
                required
              />
              {form.steps.length > 1 && (
                <button type="button" onClick={() => removeListItem('steps', i)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addListItem('steps')}>
            + Add step
          </button>
        </fieldset>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create recipe'}
        </button>
      </form>
    </div>
  );
}
