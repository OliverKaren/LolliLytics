import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  riotPuuid?: string;
  riotSummonerName?: string;
  riotRegion?: string;
}

interface AppState {
  // Auth
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;

  // Active player PUUID for analysis
  activePuuid: string | null;
  setActivePuuid: (puuid: string) => void;

  // Active patch
  activePatch: string | null;
  setActivePatch: (patch: string) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, accessToken });
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null });
      },

      // Active player
      activePuuid: null,
      setActivePuuid: (puuid) => set({ activePuuid: puuid }),

      // Patch
      activePatch: null,
      setActivePatch: (patch) => set({ activePatch: patch }),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'lol-analytics-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        activePuuid: state.activePuuid,
        activePatch: state.activePatch,
      }),
    },
  ),
);
