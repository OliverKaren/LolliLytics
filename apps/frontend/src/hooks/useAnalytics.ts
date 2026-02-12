import { useQuery, useMutation } from '@tanstack/react-query';
import { draftApi, performanceApi, tiltApi, smurfApi } from '@services/api';
import type { DraftPickAnalysis, PerformanceReport, TiltReport, SmurfReport } from '@/types';

// ── Draft Intelligence Hooks ───────────────────────────────────────────────
export function useAnalyzePick(
  payload: Parameters<typeof draftApi.analyzePick>[0] | null,
) {
  return useQuery<DraftPickAnalysis>({
    queryKey: ['draft-pick', payload],
    queryFn: () => draftApi.analyzePick(payload!),
    enabled: !!payload,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useAnalyzeDraftMutation() {
  return useMutation({
    mutationFn: draftApi.analyzeDraft,
  });
}

// ── Performance Hooks ──────────────────────────────────────────────────────
export function usePerformanceReport(
  puuid: string | null,
  period: 'last20' | 'last50' | 'season' = 'last20',
) {
  return useQuery<PerformanceReport>({
    queryKey: ['performance', puuid, period],
    queryFn: () => performanceApi.getReport(puuid!, period),
    enabled: !!puuid,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ── Tilt Detection Hooks ───────────────────────────────────────────────────
export function useTiltReport(puuid: string | null, lookback = 30) {
  return useQuery<TiltReport>({
    queryKey: ['tilt', puuid, lookback],
    queryFn: () => tiltApi.getReport(puuid!, lookback),
    enabled: !!puuid,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ── Smurf Detection Hooks ──────────────────────────────────────────────────
export function useSmurfReport(puuid: string | null) {
  return useQuery<SmurfReport>({
    queryKey: ['smurf', puuid],
    queryFn: () => smurfApi.getReport(puuid!),
    enabled: !!puuid,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
