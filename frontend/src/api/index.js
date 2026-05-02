import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Videos
export const videoAPI = {
  upload: (formData) => api.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 min for large files
  }),
  getById: (id) => api.get(`/videos/${id}`),
  getByPlayer: (playerId) => api.get(`/videos/player/${playerId}`),
};

// Analysis
export const analysisAPI = {
  getByVideo: (videoId) => api.get(`/analysis/${videoId}`),
};

// Analytics
export const analyticsAPI = {
  getPlayer: (playerId) => api.get(`/analytics/player/${playerId}`),
  getCoach: (coachId) => api.get(`/analytics/coach/${coachId}`),
  getCoachPlayer: (coachId, playerId) => api.get(`/analytics/coach/${coachId}/player/${playerId}`),
};

// Academy
export const academyAPI = {
  getPlayers: () => api.get('/academy/players'),
  addPlayer: (data) => api.post('/academy/add-player', data),
  updateBatch: (playerId, batch_name) => api.patch(`/academy/players/${playerId}/batch`, { batch_name }),
  removePlayer: (playerId) => api.delete(`/academy/players/${playerId}`),
};

export default api;
