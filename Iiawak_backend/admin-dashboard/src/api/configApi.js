import { apiCall } from './apiClient';

export const configApi = {
  getConfig: (key) => {
    return apiCall(`/config/${key}`, { method: 'GET' });
  },
  
  updateConfig: (key, value) => {
    return apiCall(`/config/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    });
  }
};
