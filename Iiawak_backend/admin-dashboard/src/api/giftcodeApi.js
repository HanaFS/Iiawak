import { apiCall } from './apiClient';

export const giftcodeApi = {
  getAll: () =>
    apiCall('/giftcodes', { method: 'GET' }),
  create: (data) =>
    apiCall('/giftcodes', { method: 'POST', body: JSON.stringify(data) }),
  redeem: (code, username) =>
    apiCall('/giftcodes/redeem', { method: 'POST', body: JSON.stringify({ code, username }) }),
  delete: (id) =>
    apiCall(`/giftcodes/${id}`, { method: 'DELETE' }),
  toggle: (id) =>
    apiCall(`/giftcodes/${id}/toggle`, { method: 'PATCH' }),
};
