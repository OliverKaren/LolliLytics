import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request-Interceptor: JWT an jeden Request anhängen ─────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response-Interceptor: bei echtem Auth-Fehler ausloggen ─────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? '';
    const isAuthError =
      error.response?.status === 401 &&
      !url.includes('riot-account') &&
      !url.includes('resolve-riot-id');

    if (isAuthError) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);