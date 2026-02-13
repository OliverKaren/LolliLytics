import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@services/api/client';

export interface SyncStatus {
  id: string;
  state: 'idle' | 'syncing' | 'error';
  totalMatchesSynced: number;
  lastSyncAddedCount: number;
  lastSyncedAt: string | null;
  latestMatchId: string | null;
  lastError: string | null;
  updatedAt: string;
}

// ── API calls ──────────────────────────────────────────────────────────────
export const syncApi = {
  getStatus: (): Promise<SyncStatus | null> =>
    apiClient.get('/match-sync/status').then((r) => r.data),

  trigger: (): Promise<{ added: number; skipped: number; errors: number; durationMs: number }> =>
    apiClient.post('/match-sync/trigger').then((r) => r.data),
};

// ── Hook ───────────────────────────────────────────────────────────────────
export function useSyncStatus() {
  return useQuery<SyncStatus | null>({
    queryKey: ['syncStatus'],
    queryFn: syncApi.getStatus,
    // Poll every 5s while a sync is running so the UI updates live
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.state === 'syncing' ? 5000 : false;
    },
    staleTime: 15_000,
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncApi.trigger,
    onSuccess: () => {
      // Refresh status after sync completes
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
