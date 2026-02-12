import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, usersApi } from '@services/api';
import { useAppStore } from '@/store';

// ── Login ──────────────────────────────────────────────────────────────────
export function useLogin() {
  const { setAuth } = useAppStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      navigate('/dashboard');
    },
  });
}

// ── Register ───────────────────────────────────────────────────────────────
export function useRegister() {
  const { setAuth } = useAppStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({
      email,
      username,
      password,
    }: {
      email: string;
      username: string;
      password: string;
    }) => authApi.register(email, username, password),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      // After register → go to settings to link Riot account
      navigate('/settings');
    },
  });
}

// ── Logout ─────────────────────────────────────────────────────────────────
export function useLogout() {
  const { clearAuth } = useAppStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    clearAuth();
    queryClient.clear();
    navigate('/login');
  };
}

// ── Current User ───────────────────────────────────────────────────────────
export function useCurrentUser() {
  const { accessToken, setAuth, user } = useAppStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const freshUser = await usersApi.getMe();
      // Keep store in sync with fresh server data
      if (accessToken) setAuth(freshUser, accessToken);
      return freshUser;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

// ── Link Riot Account ──────────────────────────────────────────────────────
export function useLinkRiotAccount() {
  const { setActivePuuid, accessToken, setAuth } = useAppStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      gameName,
      tagLine,
      platform,
    }: {
      gameName: string;
      tagLine: string;
      platform: string;
    }) => usersApi.linkRiotAccount(gameName, tagLine, platform),
    onSuccess: (updatedUser) => {
      // Auto-set the PUUID as active for all analysis
      if (updatedUser.riotPuuid) {
        setActivePuuid(updatedUser.riotPuuid);
      }
      if (accessToken) setAuth(updatedUser, accessToken);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// ── Unlink Riot Account ────────────────────────────────────────────────────
export function useUnlinkRiotAccount() {
  const { setActivePuuid, accessToken, setAuth } = useAppStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => usersApi.unlinkRiotAccount(),
    onSuccess: (updatedUser) => {
      setActivePuuid('');
      if (accessToken) setAuth(updatedUser, accessToken);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// ── Resolve Riot ID (scouting) ─────────────────────────────────────────────
export function useResolveRiotId() {
  return useMutation({
    mutationFn: ({
      gameName,
      tagLine,
      platform,
    }: {
      gameName: string;
      tagLine: string;
      platform: string;
    }) => usersApi.resolveRiotId(gameName, tagLine, platform),
  });
}
