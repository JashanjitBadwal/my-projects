// Thin wrapper around fetch for talking to the backend API.
// Requests are sent to /api/* which Vite proxies to the Express server.
const BASE_URL = '/api';

// Core request helper: builds headers, sends JSON, and normalizes errors.
async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // No content (e.g. DELETE / favorite toggles) - nothing to parse.
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  // Surface the server's error message, if any, as a thrown Error.
  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }

  return data;
}

// All API calls used by the app, grouped by resource.
export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),

  // Recipes
  getRecipes: (params = {}, token) => {
    // Drop empty/undefined params so they don't end up as ?search=&category=.
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString();
    return request(`/recipes${query ? `?${query}` : ''}`, { token });
  },
  getCategories: () => request('/recipes/categories'),
  getRecipe: (id, token) => request(`/recipes/${id}`, { token }),
  createRecipe: (payload, token) => request('/recipes', { method: 'POST', body: payload, token }),
  updateRecipe: (id, payload, token) =>
    request(`/recipes/${id}`, { method: 'PUT', body: payload, token }),
  deleteRecipe: (id, token) => request(`/recipes/${id}`, { method: 'DELETE', token }),

  // Favorites
  addFavorite: (id, token) => request(`/recipes/${id}/favorite`, { method: 'POST', token }),
  removeFavorite: (id, token) => request(`/recipes/${id}/favorite`, { method: 'DELETE', token }),
};
