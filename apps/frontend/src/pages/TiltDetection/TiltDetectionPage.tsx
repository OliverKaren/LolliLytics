import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { SectionHeader, StatCard, ScoreBadge, ProgressBar, RiskBadge, LoadingSpinner } from '@components/common/ui';
import { useAppStore } from '@/store';
import { useTiltReport } from '@/hooks/useAnalytics';

export function TiltDetectionPage() {
  const { activePuuid } = useAppStore();
  const { data, isLoading } = useTiltReport(activePuuid);

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Tilt & Consistency Detection"
        subtitle="Loss streak analysis, session fatigue and optimal play-time recommendations"
      />

      {!activePuuid && (
        <div className="card text-center py-12">
          <p className="text-text-muted">Link your Riot account to see tilt data.</p>
        </div>
      )}

      {isLoading && activePuuid && (
        <div className="card flex items-center justify-center py-12">
          <LoadingSpinner size={32} />
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Top Row: Key Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card flex flex-col items-center gap-2">
              <p className="label">Tilt Risk</p>
              <RiskBadge level={data.tiltRiskLevel} />
              <ScoreBadge score={data.tiltRiskIndicator} />
            </div>
            <div className="card flex flex-col items-center gap-2">
              <p className="label">Consistency</p>
              <ScoreBadge score={data.consistencyScore} size="lg" />
            </div>
            <StatCard
              label="Current Loss Streak"
              value={data.currentLossStreak}
              sub={data.lossStreakDetected ? 'Streak detected!' : 'No streak'}
              trend={data.lossStreakDetected ? 'down' : 'neutral'}
              highlight={data.lossStreakDetected}
            />
            <StatCard
              label="Session Fatigue"
              value={data.sessionFatigueDetected ? 'Detected' : 'Normal'}
              sub={data.sessionFatigueDetected ? 'Take a break!' : 'You\'re good'}
              trend={data.sessionFatigueDetected ? 'down' : 'up'}
            />
          </div>

          {/* Time of Day Analysis */}
          <div className="card">
            <h3 className="section-title mb-4">Time of Day Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.timeOfDayStats} barSize={36}>
                  <XAxis dataKey="timeWindow" tick={{ fill: '#8a9bc0', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#8a9bc0', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#141c2e', border: '1px solid #1e2d4a', borderRadius: 8, color: '#e8e0d0' }}
                    formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Win Rate']}
                  />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                    {data.timeOfDayStats.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.timeWindow === data.bestTimeOfDay
                            ? '#00d87f'
                            : entry.timeWindow === data.worstTimeOfDay
                            ? '#ff4655'
                            : '#1e2d4a'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {data.bestTimeOfDay && (
                  <div className="card-elevated border-accent-green/20">
                    <p className="label text-accent-green mb-0.5">Best Time to Play</p>
                    <p className="font-semibold text-text-primary">{data.bestTimeOfDay}</p>
                  </div>
                )}
                {data.worstTimeOfDay && (
                  <div className="card-elevated border-accent-red/20">
                    <p className="label text-accent-red mb-0.5">Worst Time to Play</p>
                    <p className="font-semibold text-text-primary">{data.worstTimeOfDay}</p>
                  </div>
                )}
                <div>
                  <ProgressBar
                    label="Champion Stability"
                    value={data.champStabilityScore}
                    color={data.champStabilityScore >= 60 ? 'green' : 'gold'}
                  />
                </div>
                <div>
                  <ProgressBar
                    label="Role Stability"
                    value={data.roleStabilityScore}
                    color={data.roleStabilityScore >= 60 ? 'green' : 'gold'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div className="card">
              <h3 className="section-title mb-4">Recommendations</h3>
              <ul className="space-y-2">
                {data.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border text-sm text-text-secondary"
                  >
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
