const BASE_URL = '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),

  getRecipes: (params = {}, token) => {
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
  addFavorite: (id, token) => request(`/recipes/${id}/favorite`, { method: 'POST', token }),
  removeFavorite: (id, token) => request(`/recipes/${id}/favorite`, { method: 'DELETE', token }),
};
