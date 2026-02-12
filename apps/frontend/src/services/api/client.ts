import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nur ausloggen wenn es ein Auth-Endpunkt-Problem ist,
    // NICHT bei 401 von Riot API (z.B. /users/me/riot-account)
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