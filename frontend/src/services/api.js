import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('railway_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.code === 'ECONNABORTED') return 'The request took too long. Check that the backend is running.';
  if (!error?.response) return 'Could not reach the API. Make sure MySQL and the backend are running.';
  return error.response.data?.error || error.response.data?.message || fallback;
}

export default api;
