import { useState } from 'react';
import { SectionHeader, StatCard, ProgressBar, LoadingSpinner } from '@components/common/ui';
import { useAppStore } from '@/store';
import { useAnalyzeDraftMutation } from '@/hooks/useAnalytics';
import type { DraftSessionAnalysis } from '@/types';

const CONFIDENCE_CONFIG = {
  HIGH_CONFIDENCE: { label: '✅ High Confidence', color: 'text-accent-green' },
  RISKY_PICK: { label: '⚠️ Risky Pick', color: 'text-accent-orange' },
  COUNTER_RISK: { label: '🔴 Counter Risk', color: 'text-accent-red' },
  NORMAL: { label: '➡️ Standard Pick', color: 'text-text-secondary' },
};

const MATCHUP_CONFIG = {
  EASY: { label: 'Easy Matchup', color: 'text-accent-green' },
  MEDIUM: { label: 'Even Matchup', color: 'text-primary' },
  HARD: { label: 'Hard Matchup', color: 'text-accent-red' },
  UNKNOWN: { label: 'Unknown', color: 'text-text-muted' },
};

export function DraftIntelligencePage() {
  const { activePuuid } = useAppStore();
  const mutation = useAnalyzeDraftMutation();

  const [myChampion, setMyChampion] = useState('');
  const [allyChampions, setAllyChampions] = useState('');
  const [enemyChampions, setEnemyChampions] = useState('');
  const [result, setResult] = useState<DraftSessionAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!activePuuid || !myChampion.trim()) return;
    const data = await mutation.mutateAsync({
      puuid: activePuuid,
      myChampion: myChampion.trim(),
      allyChampions: allyChampions.split(',').map((s) => s.trim()).filter(Boolean),
      enemyChampions: enemyChampions.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setResult(data);
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Draft Intelligence"
        subtitle="Real-time pick analysis with matchup difficulty and team synergy"
      />

      {/* Input Panel */}
      <div className="card mb-6">
        <h3 className="section-title mb-4">Draft Setup</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label block mb-1.5">Your Champion</label>
            <input
              type="text"
              value={myChampion}
              onChange={(e) => setMyChampion(e.target.value)}
              placeholder="e.g. Jinx"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="label block mb-1.5">Allied Champions (comma-separated)</label>
            <input
              type="text"
              value={allyChampions}
              onChange={(e) => setAllyChampions(e.target.value)}
              placeholder="e.g. Nautilus, Orianna, Garen"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="label block mb-1.5">Enemy Champions (comma-separated)</label>
            <input
              type="text"
              value={enemyChampions}
              onChange={(e) => setEnemyChampions(e.target.value)}
              placeholder="e.g. Thresh, Zed, Darius"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={mutation.isPending || !activePuuid || !myChampion.trim()}
          className="btn-primary"
        >
          {mutation.isPending ? 'Analyzing…' : 'Analyze Draft'}
        </button>
        {!activePuuid && (
          <p className="text-xs text-accent-red mt-2">Link your Riot account first in Settings.</p>
        )}
      </div>

      {/* Loading State */}
      {mutation.isPending && (
        <div className="card flex items-center justify-center py-12">
          <LoadingSpinner size={32} />
        </div>
      )}

      {/* Results */}
      {result && !mutation.isPending && (
        <div className="space-y-6">
          {result.picks.map((pick) => {
            const conf = CONFIDENCE_CONFIG[pick.confidence];
            const matchup = MATCHUP_CONFIG[pick.matchupDifficulty];

            return (
              <div key={pick.championName} className="card">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-text-primary">
                      {pick.championName}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-sm font-medium ${conf.color}`}>
                        {conf.label}
                      </span>
                      {pick.isComfortPick && (
                        <span className="stat-badge-gold">Comfort Pick</span>
                      )}
                      {pick.isRiskPick && (
                        <span className="stat-badge-red">Risk Pick</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="label">Games Played</p>
                    <p className="text-2xl font-mono font-bold text-text-primary">
                      {pick.gamesPlayedTotal}
                    </p>
                  </div>
                </div>

                {/* Win Rate Stats */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <StatCard
                    label="Win Rate (Patch)"
                    value={pick.winRatePatch != null ? `${(pick.winRatePatch * 100).toFixed(1)}%` : 'N/A'}
                  />
                  <StatCard
                    label="Win Rate (30 Days)"
                    value={pick.winRate30Days != null ? `${(pick.winRate30Days * 100).toFixed(1)}%` : 'N/A'}
                  />
                  <StatCard
                    label="Win Rate (Season)"
                    value={pick.winRateSeason != null ? `${(pick.winRateSeason * 100).toFixed(1)}%` : 'N/A'}
                  />
                </div>

                {/* Matchup & Synergy */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="card-elevated">
                    <p className="label mb-2">Matchup Difficulty</p>
                    <span className={`font-semibold ${matchup.color}`}>{matchup.label}</span>
                    {pick.matchupWinRate != null && (
                      <p className="text-xs text-text-muted mt-1">
                        WR vs enemy: {(pick.matchupWinRate * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div className="card-elevated">
                    <p className="label mb-2">Team Synergy</p>
                    <ProgressBar value={pick.teamSynergyScore} color="blue" showValue />
                  </div>
                </div>

                {/* Hints */}
                {pick.hints.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="label mb-2">Draft Hints</p>
                    <ul className="space-y-1">
                      {pick.hints.map((hint, i) => (
                        <li key={i} className="text-sm text-text-secondary">
                          {hint}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}

          {/* Draft Warnings */}
          {result.draftWarnings.length > 0 && (
            <div className="card border-accent-orange/30">
              <p className="label text-accent-orange mb-2">Draft Warnings</p>
              <ul className="space-y-1">
                {result.draftWarnings.map((w, i) => (
                  <li key={i} className="text-sm text-text-secondary">⚠️ {w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
