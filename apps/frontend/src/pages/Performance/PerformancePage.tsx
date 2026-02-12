import { useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import { SectionHeader, StatCard, ProgressBar, ScoreBadge, LoadingSpinner } from '@components/common/ui';
import { useAppStore } from '@/store';
import { usePerformanceReport } from '@/hooks/useAnalytics';

const PERIOD_OPTS = [
  { value: 'last20', label: 'Last 20 Games' },
  { value: 'last50', label: 'Last 50 Games' },
  { value: 'season', label: 'Full Season' },
] as const;

export function PerformancePage() {
  const { activePuuid } = useAppStore();
  const [period, setPeriod] = useState<'last20' | 'last50' | 'season'>('last20');

  const { data, isLoading, error } = usePerformanceReport(activePuuid, period);

  const radarData = data
    ? [
        { stat: 'KDA', value: data.percentileRankings.kda },
        { stat: 'CS/min', value: data.percentileRankings.cs },
        { stat: 'Damage', value: data.percentileRankings.damageShare },
        { stat: 'Vision', value: data.percentileRankings.vision },
        { stat: 'Win Rate', value: data.playerStats.winRate * 100 },
      ]
    : [];

  const benchmarkData = data
    ? [
        {
          rank: 'Master',
          score: data.benchmarks.master.overallScore,
          fill: '#c89b3c',
        },
        {
          rank: 'GM',
          score: data.benchmarks.grandmaster.overallScore,
          fill: '#9b59ff',
        },
        {
          rank: 'Challenger',
          score: data.benchmarks.challenger.overallScore,
          fill: '#0bc4e3',
        },
      ]
    : [];

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Performance Benchmarking"
        subtitle="Compare your performance against Master, Grandmaster, and Challenger averages"
        action={
          <div className="flex gap-2">
            {PERIOD_OPTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  period === opt.value
                    ? 'bg-primary text-background font-semibold'
                    : 'btn-ghost'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      {!activePuuid && (
        <div className="card text-center py-12">
          <p className="text-text-muted">Link your Riot account to see performance data.</p>
        </div>
      )}

      {isLoading && activePuuid && (
        <div className="card flex items-center justify-center py-12">
          <LoadingSpinner size={32} />
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Top Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Games Analyzed" value={data.playerStats.gamesAnalyzed} />
            <StatCard
              label="Win Rate"
              value={`${(data.playerStats.winRate * 100).toFixed(1)}%`}
              trend={data.playerStats.winRate > 0.52 ? 'up' : 'down'}
              sub="vs 50% baseline"
            />
            <StatCard
              label="Avg KDA"
              value={data.playerStats.avgKda.toFixed(2)}
              highlight={data.percentileRankings.kda >= 70}
            />
            <StatCard
              label="Avg CS/min"
              value={data.playerStats.avgCsPerMinute.toFixed(1)}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Radar Chart */}
            <div className="card">
              <h3 className="section-title mb-4">Percentile Rankings</h3>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="60%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1e2d4a" />
                    <PolarAngleAxis dataKey="stat" tick={{ fill: '#8a9bc0', fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      dataKey="value"
                      stroke="#c89b3c"
                      fill="#c89b3c"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {[
                    { label: 'KDA', val: data.percentileRankings.kda },
                    { label: 'CS/min', val: data.percentileRankings.cs },
                    { label: 'Damage', val: data.percentileRankings.damageShare },
                    { label: 'Vision', val: data.percentileRankings.vision },
                  ].map(({ label, val }) => (
                    <ProgressBar
                      key={label}
                      label={label}
                      value={val}
                      color={val >= 70 ? 'green' : val >= 40 ? 'gold' : 'red'}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Benchmark Comparison */}
            <div className="card">
              <h3 className="section-title mb-4">vs High-Elo Benchmarks</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={benchmarkData} barSize={32}>
                  <XAxis dataKey="rank" tick={{ fill: '#8a9bc0', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#8a9bc0', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#141c2e', border: '1px solid #1e2d4a', borderRadius: 8, color: '#e8e0d0' }}
                    formatter={(v: number) => [`${v.toFixed(0)}/100`, 'Score']}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {benchmarkData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lane Phase & Objective */}
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="section-title mb-3">Lane Phase Score</h3>
              <div className="flex items-center gap-4">
                <ScoreBadge score={data.lanePhaseScore} size="lg" />
                <ProgressBar value={data.lanePhaseScore} color="gold" label="Lane Phase Strength" />
              </div>
            </div>
            <div className="card">
              <h3 className="section-title mb-3">Objective Impact</h3>
              <div className="flex items-center gap-4">
                <ScoreBadge score={data.objectiveImpactScore} size="lg" />
                <ProgressBar value={data.objectiveImpactScore} color="blue" label="Objective Impact" />
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-5">
            <div className="card border-accent-green/20">
              <h3 className="section-title text-accent-green mb-3">Strengths</h3>
              {data.strengths.length ? (
                <ul className="space-y-1">
                  {data.strengths.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="text-accent-green">✓</span> {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">Not enough data yet.</p>
              )}
            </div>
            <div className="card border-accent-red/20">
              <h3 className="section-title text-accent-red mb-3">Areas to Improve</h3>
              {data.weaknesses.length ? (
                <ul className="space-y-1">
                  {data.weaknesses.map((w) => (
                    <li key={w} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="text-accent-red">✗</span> {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-accent-green text-sm">No significant weaknesses detected!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
