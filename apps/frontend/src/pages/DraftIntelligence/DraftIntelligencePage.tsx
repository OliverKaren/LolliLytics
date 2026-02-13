import { useState } from 'react';
import { SectionHeader, StatCard, ProgressBar, LoadingSpinner } from '@components/common/ui';
import { ChampionPicker, MultiChampionPicker } from '@components/draft/ChampionPicker';
import { useAppStore } from '@/store';
import { useAnalyzeDraftMutation } from '@/hooks/useAnalytics';
import { useChampions } from '@hooks/useChampions';
import type { DraftSessionAnalysis } from '@/types';

const CONFIDENCE_CONFIG = {
  HIGH_CONFIDENCE: { label: '✅ High Confidence', color: 'text-accent-green' },
  RISKY_PICK:      { label: '⚠️ Risky Pick',      color: 'text-accent-orange' },
  COUNTER_RISK:    { label: '🔴 Counter Risk',     color: 'text-accent-red' },
  NORMAL:          { label: '➡️ Standard Pick',    color: 'text-text-secondary' },
};

const MATCHUP_CONFIG = {
  EASY:    { label: 'Easy Matchup',  color: 'text-accent-green' },
  MEDIUM:  { label: 'Even Matchup',  color: 'text-primary' },
  HARD:    { label: 'Hard Matchup',  color: 'text-accent-red' },
  UNKNOWN: { label: 'Unknown',       color: 'text-text-muted' },
};

export function DraftIntelligencePage() {
  const { activePuuid } = useAppStore();
  const mutation = useAnalyzeDraftMutation();
  const { data: champions = [] } = useChampions();

  // Champion IDs (e.g. "Jinx", "MissFortune")
  const [myChampion, setMyChampion]       = useState('');
  const [allyChampions, setAllyChampions] = useState<string[]>([]);
  const [enemyChampions, setEnemyChampions] = useState<string[]>([]);
  const [result, setResult] = useState<DraftSessionAnalysis | null>(null);

  // Helper: ID → display name
  const getName = (id: string) =>
    champions.find((c) => c.id === id)?.name ?? id;

  const handleAnalyze = async () => {
    if (!activePuuid || !myChampion) return;
    const data = await mutation.mutateAsync({
      puuid: activePuuid,
      myChampion: getName(myChampion),
      allyChampions: allyChampions.map(getName),
      enemyChampions: enemyChampions.map(getName),
    });
    setResult(data);
  };

  const canAnalyze = !!activePuuid && !!myChampion && !mutation.isPending;

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Draft Intelligence"
        subtitle="Echtzeit Pick-Analyse mit Matchup-Schwierigkeit und Team-Synergie"
      />

      {/* ── Input Panel ─────────────────────────────────────────────────── */}
      <div className="card mb-6">
        <h3 className="section-title mb-5">Draft Setup</h3>

        {/* Row 1: My Champion */}
        <div className="mb-4">
          <ChampionPicker
            label="Dein Champion"
            value={myChampion}
            onChange={setMyChampion}
            placeholder="Wähle deinen Champion…"
          />
        </div>

        {/* Row 2: Allies & Enemies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <MultiChampionPicker
            label="Verbündete Champions"
            values={allyChampions}
            onChange={setAllyChampions}
            maxCount={4}
            placeholder="Bis zu 4 Verbündete…"
            teamColor="blue"
          />
          <MultiChampionPicker
            label="Gegnerische Champions"
            values={enemyChampions}
            onChange={setEnemyChampions}
            maxCount={5}
            placeholder="Bis zu 5 Gegner…"
            teamColor="red"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className="btn-primary px-6"
          >
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-background/40 border-t-background animate-spin" />
                Analysiere…
              </span>
            ) : (
              'Draft analysieren'
            )}
          </button>

          {(myChampion || allyChampions.length || enemyChampions.length) && (
            <button
              type="button"
              onClick={() => {
                setMyChampion('');
                setAllyChampions([]);
                setEnemyChampions([]);
                setResult(null);
                mutation.reset();
              }}
              className="btn-ghost text-sm"
            >
              Zurücksetzen
            </button>
          )}
        </div>

        {!activePuuid && (
          <p className="text-xs text-accent-red mt-3">
            Verknüpfe zuerst deinen Riot Account in den Einstellungen.
          </p>
        )}

        {mutation.isError && (
          <p className="text-xs text-accent-red mt-3">
            Fehler bei der Analyse. Bitte versuche es erneut.
          </p>
        )}
      </div>

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {mutation.isPending && (
        <div className="card flex items-center justify-center py-12 gap-3">
          <LoadingSpinner size={28} />
          <span className="text-text-secondary text-sm">Analysiere Draft…</span>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {result && !mutation.isPending && (
        <div className="space-y-5">
          {result.picks.map((pick) => {
            const conf    = CONFIDENCE_CONFIG[pick.confidence];
            const matchup = MATCHUP_CONFIG[pick.matchupDifficulty];
            const champData = champions.find((c) => c.name === pick.championName);

            return (
              <div key={pick.championName} className="card">
                {/* Header */}
                <div className="flex items-center gap-4 mb-5">
                  {champData && (
                    <img
                      src={champData.iconUrl}
                      alt={pick.championName}
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-border"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl font-semibold text-text-primary">
                      {pick.championName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
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
                  <div className="text-right flex-shrink-0">
                    <p className="label">Gespielte Partien</p>
                    <p className="text-2xl font-mono font-bold text-text-primary">
                      {pick.gamesPlayedTotal}
                    </p>
                  </div>
                </div>

                {/* Win Rate Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <StatCard
                    label="Winrate (Patch)"
                    value={pick.winRatePatch != null ? `${(pick.winRatePatch * 100).toFixed(1)}%` : 'N/A'}
                  />
                  <StatCard
                    label="Winrate (30 Tage)"
                    value={pick.winRate30Days != null ? `${(pick.winRate30Days * 100).toFixed(1)}%` : 'N/A'}
                  />
                  <StatCard
                    label="Winrate (Season)"
                    value={pick.winRateSeason != null ? `${(pick.winRateSeason * 100).toFixed(1)}%` : 'N/A'}
                  />
                </div>

                {/* Matchup & Synergy */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="card-elevated">
                    <p className="label mb-2">Matchup Difficulty</p>
                    <span className={`font-semibold ${matchup.color}`}>
                      {matchup.label}
                    </span>
                    {pick.matchupWinRate != null && (
                      <p className="text-xs text-text-muted mt-1">
                        WR vs Gegner: {(pick.matchupWinRate * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div className="card-elevated">
                    <p className="label mb-2">Team-Synergie</p>
                    <ProgressBar value={pick.teamSynergyScore} color="blue" showValue />
                  </div>
                </div>

                {/* Hints */}
                {pick.hints.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="label mb-2">Draft Hinweise</p>
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
              <p className="label text-accent-orange mb-2">Draft Warnungen</p>
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
