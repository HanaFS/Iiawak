import { apiCall } from './apiClient';

export const communityApi = {
  getFeed: () => apiCall('/community/feed'),
  createPost: (content) =>
    apiCall('/community', { method: 'POST', body: JSON.stringify({ content }) }),
  firePost: (id) =>
    apiCall(`/community/${id}/fire`, { method: 'POST' }),
  addComment: (id, content) =>
    apiCall(`/community/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  getComments: (id) => apiCall(`/community/${id}/comments`)
};
