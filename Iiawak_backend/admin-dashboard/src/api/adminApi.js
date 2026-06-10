import { apiCall } from './apiClient';

export const adminApi = {
  getDashboard: () => apiCall('/admin/dashboard'),

  // Users
  getUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiCall(`/admin/users?${q}`);
  },
  getUser: (id) => apiCall(`/admin/users/${id}`),
  banUser: (id, action, reason) =>
    apiCall(`/admin/users/${id}/ban`, { method: 'PUT', body: JSON.stringify({ action, reason }) }),
  adjustKch: (id, amount, reason) =>
    apiCall(`/admin/users/${id}/adjust-kch`, { method: 'POST', body: JSON.stringify({ amount, reason }) }),

  // Characters
  getCharacters: () => apiCall('/admin/characters'),
  updateCharacter: (id, data) =>
    apiCall(`/admin/characters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCharacter: (id) =>
    apiCall(`/admin/characters/${id}`, { method: 'DELETE' }),

  // Posts
  getPosts: () => apiCall('/admin/posts'),
  deletePost: (id) => apiCall(`/admin/posts/${id}`, { method: 'DELETE' })
};
