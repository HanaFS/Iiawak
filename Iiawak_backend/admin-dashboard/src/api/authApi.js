import { apiCall } from './apiClient';

export const authApi = {
  login: (email, password) =>
    apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => { localStorage.removeItem('iiawak_admin_token'); }
};
