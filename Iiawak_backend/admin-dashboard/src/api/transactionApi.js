import { apiCall } from './apiClient';

export const transactionApi = {
  getTransactions: (status = '', type = '') => {
    let url = '/transactions?';
    if (status) url += `status=${status}&`;
    if (type) url += `type=${type}&`;
    return apiCall(url, { method: 'GET' });
  },
  
  approveTransaction: (id) => {
    return apiCall(`/transactions/${id}/approve`, { method: 'POST' });
  },
  
  rejectTransaction: (id) => {
    return apiCall(`/transactions/${id}/reject`, { method: 'POST' });
  },
};
