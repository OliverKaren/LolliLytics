import { apiClient } from './client';

// ── Draft Intelligence ─────────────────────────────────────────────────────
export const draftApi = {
  analyzePick: (payload: {
    puuid: string;
    championName: string;
    enemyChampionName?: string;
    allyChampions?: string[];
    patch?: string;
  }) => apiClient.post('/draft-intelligence/analyze-pick', payload).then((r) => r.data),

  analyzeDraft: (payload: {
    puuid: string;
    myChampion: string;
    allyChampions: string[];
    enemyChampions: string[];
    patch?: string;
  }) => apiClient.post('/draft-intelligence/analyze-draft', payload).then((r) => r.data),

  getChampionStats: (puuid: string, championName: string, patch?: string) =>
    apiClient
      .get(`/draft-intelligence/champion-stats/${puuid}/${championName}`, {
        params: { patch },
      })
      .then((r) => r.data),
};

// ── Performance Benchmarking ───────────────────────────────────────────────
export const performanceApi = {
  getReport: (puuid: string, period: 'last20' | 'last50' | 'season' = 'last20') =>
    apiClient.get(`/performance/report/${puuid}`, { params: { period } }).then((r) => r.data),
};

// ── Tilt Detection ─────────────────────────────────────────────────────────
export const tiltApi = {
  getReport: (puuid: string, lookback = 30) =>
    apiClient
      .get(`/tilt-detection/report/${puuid}`, { params: { lookback } })
      .then((r) => r.data),
};

// ── Smurf Detection ────────────────────────────────────────────────────────
export const smurfApi = {
  getReport: (puuid: string) =>
    apiClient.get(`/smurf-detection/report/${puuid}`).then((r) => r.data),
};

// ── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, username: string, password: string) =>
    apiClient.post('/auth/register', { email, username, password }).then((r) => r.data),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }).then((r) => r.data),
};

// ── Users ──────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => apiClient.get('/users/me').then((r) => r.data),

  linkRiotAccount: (puuid: string, summonerName: string, region: string) =>
    apiClient
      .patch('/users/me/riot-account', { puuid, summonerName, region })
      .then((r) => r.data),
};
