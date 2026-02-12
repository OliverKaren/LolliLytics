import { useState } from 'react';
import { SectionHeader, StatCard, ProgressBar, ScoreBadge, LoadingSpinner } from '@components/common/ui';
import { useAppStore } from '@/store';
import { useSmurfReport } from '@/hooks/useAnalytics';

const CONFIDENCE_LABELS = {
  LOW: { label: 'Low Confidence', color: 'text-text-muted' },
  MEDIUM: { label: 'Medium Confidence', color: 'text-primary' },
  HIGH: { label: 'High Confidence', color: 'text-accent-blue' },
  VERY_HIGH: { label: 'Very High Confidence', color: 'text-accent-red' },
};

export function SmurfDetectionPage() {
  const { activePuuid } = useAppStore();
  const [targetPuuid, setTargetPuuid] = useState('');
  const [analysisPuuid, setAnalysisPuuid] = useState<string | null>(null);

  const { data, isLoading, error } = useSmurfReport(analysisPuuid);

  const runAnalysis = () => {
    const puuid = targetPuuid.trim() || activePuuid;
    if (puuid) setAnalysisPuuid(puuid);
  };

  const conf = data ? CONFIDENCE_LABELS[data.confidenceLevel] : null;
  const smurfScore = data?.smurfProbabilityScore ?? 0;

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Smurf / Hidden MMR Detection"
        subtitle="Identify unusual rank progression, outlier mechanics and hidden MMR indicators"
      />

      {/* Input Panel */}
      <div className="card mb-6">
        <h3 className="section-title mb-4">Target Player</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={targetPuuid}
            onChange={(e) => setTargetPuuid(e.target.value)}
            placeholder="Enter PUUID (leave empty to use your linked account)"
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
          />
          <button
            onClick={runAnalysis}
            disabled={isLoading || (!targetPuuid.trim() && !activePuuid)}
            className="btn-primary whitespace-nowrap"
          >
            {isLoading ? 'Analyzing…' : 'Analyze Account'}
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2">
          Useful for: Opponent scouting · Clash/Scrim prep · Identifying suspicious accounts
        </p>
      </div>

      {isLoading && (
        <div className="card flex items-center justify-center py-12">
          <LoadingSpinner size={32} />
        </div>
      )}

      {data && !isLoading && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="card">
            <div className="flex items-center gap-6">
              <ScoreBadge score={smurfScore} size="lg" />
              <div>
                <h3 className="font-display text-xl font-semibold text-text-primary">
                  Smurf Probability Score
                </h3>
                <p className={`text-sm font-medium mt-1 ${conf?.color}`}>
                  {conf?.label}
                </p>
                <p className="text-sm text-text-secondary mt-2 max-w-lg">{data.summary}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div>
                <ProgressBar
                  label="Rank Progression"
                  value={data.rankProgressionScore}
                  color={data.rankProgressionScore >= 70 ? 'red' : 'green'}
                />
              </div>
              <div>
                <ProgressBar
                  label="WR vs Rank Avg"
                  value={data.winRateVsRankScore}
                  color={data.winRateVsRankScore >= 70 ? 'red' : 'green'}
                />
              </div>
              <div>
                <ProgressBar
                  label="Mechanical Outliers"
                  value={data.mechanicalOutlierScore}
                  color={data.mechanicalOutlierScore >= 70 ? 'red' : 'green'}
                />
              </div>
            </div>
          </div>

          {/* Signal Breakdown */}
          <div className="card">
            <h3 className="section-title mb-4">Detection Signals</h3>
            <div className="space-y-3">
              {data.signals.map((signal) => (
                <div
                  key={signal.signal}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    signal.detected
                      ? 'border-accent-red/30 bg-accent-red/5'
                      : 'border-border bg-background'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      signal.detected ? 'bg-accent-red' : 'bg-accent-green'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${signal.detected ? 'text-accent-red' : 'text-text-primary'}`}>
                        {signal.detected ? '⚠️ ' : '✅ '}
                        {signal.signal.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                      <span className="text-xs text-text-muted">Weight: {signal.weight}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{signal.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
