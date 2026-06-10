import { apiCall } from './apiClient';

export const economyApi = {
  getPackages: () => apiCall('/economy/packages'),
  createPackage: (data) =>
    apiCall('/economy/packages', { method: 'POST', body: JSON.stringify(data) }),
  updatePackage: (id, data) =>
    apiCall(`/economy/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePackage: (id) =>
    apiCall(`/economy/packages/${id}`, { method: 'DELETE' })
};
