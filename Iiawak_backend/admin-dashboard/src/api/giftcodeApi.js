import { apiCall } from './apiClient';

export const giftcodeApi = {
  create: (data) =>
    apiCall('/giftcodes/create', { method: 'POST', body: JSON.stringify(data) }),
  redeem: (code, username) =>
    apiCall('/giftcodes/redeem', { method: 'POST', body: JSON.stringify({ code, username }) })
};
