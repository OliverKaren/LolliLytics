import { apiClient } from './client';

// ── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, username: string, password: string) =>
    apiClient.post('/auth/register', { email, username, password }).then((r) => r.data),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }).then((r) => r.data),
};

// ── Users ──────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () =>
    apiClient.get('/users/me').then((r) => r.data),

  /** Link Riot account by Riot ID (gameName#tagLine) + platform */
  linkRiotAccount: (gameName: string, tagLine: string, platform: string) =>
    apiClient
      .post('/users/me/riot-account', { gameName, tagLine, platform })
      .then((r) => r.data),

  unlinkRiotAccount: () =>
    apiClient.delete('/users/me/riot-account').then((r) => r.data),

  /** Resolve any Riot ID to PUUID without linking (opponent scouting) */
  resolveRiotId: (gameName: string, tagLine: string, platform: string) =>
    apiClient
      .post('/users/resolve-riot-id', { gameName, tagLine, platform })
      .then((r) => r.data),
};

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
};

// ── Performance Benchmarking ───────────────────────────────────────────────
export const performanceApi = {
  getReport: (puuid: string, period: 'last20' | 'last50' | 'season' = 'last20') =>
    apiClient.get(`/performance/report/${puuid}`, { params: { period } }).then((r) => r.data),
};

// ── Tilt Detection ─────────────────────────────────────────────────────────
export const tiltApi = {
  getReport: (puuid: string, lookback = 30) =>
    apiClient.get(`/tilt-detection/report/${puuid}`, { params: { lookback } }).then((r) => r.data),
};

// ── Smurf Detection ────────────────────────────────────────────────────────
export const smurfApi = {
  getReport: (puuid: string) =>
    apiClient.get(`/smurf-detection/report/${puuid}`).then((r) => r.data),
};
