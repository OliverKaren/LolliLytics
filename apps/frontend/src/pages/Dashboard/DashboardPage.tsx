import { Brain, BarChart3, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeader, StatCard } from '@components/common/ui';
import { useAppStore } from '@/store';

const MODULES = [
  {
    to: '/draft',
    icon: Brain,
    title: 'Draft Intelligence',
    description: 'Live winrate, matchup difficulty, team synergy and comfort pick detection',
    color: 'accent-blue',
    features: ['Champion Winrate (Patch / 30d / Season)', 'Matchup Difficulty', 'Team Synergy Score', 'Comfort & Risk Picks'],
  },
  {
    to: '/performance',
    icon: BarChart3,
    title: 'Performance Benchmarking',
    description: 'Compare your stats against Master, GM and Challenger benchmarks',
    color: 'primary',
    features: ['Percentile Rankings', 'Lane Phase Strength', 'Objective Impact', 'Strength / Weakness Detection'],
  },
  {
    to: '/tilt',
    icon: AlertTriangle,
    title: 'Tilt Detection',
    description: 'Detect loss streaks, session fatigue and best playing times',
    color: 'accent-red',
    features: ['Loss Streak Detection', 'Session Fatigue', 'Time of Day Analysis', 'Consistency Score'],
  },
  {
    to: '/smurf',
    icon: ShieldAlert,
    title: 'Smurf Detection',
    description: 'Identify smurfs and hidden MMR outliers in your games',
    color: 'accent-purple',
    features: ['Rank Progression Analysis', 'WR vs Rank Average', 'Mechanical Outlier Stats', 'Smurf Probability Score'],
  },
];

const colorMap: Record<string, string> = {
  'accent-blue': 'text-accent-blue border-accent-blue/20 bg-accent-blue/5',
  'primary': 'text-primary border-primary/20 bg-primary/5',
  'accent-red': 'text-accent-red border-accent-red/20 bg-accent-red/5',
  'accent-purple': 'text-accent-purple border-accent-purple/20 bg-accent-purple/5',
};

export function DashboardPage() {
  const { user, activePuuid } = useAppStore();

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Dashboard"
        subtitle={
          activePuuid
            ? `Analysing PUUID: ${activePuuid.slice(0, 16)}…`
            : 'Link your Riot account to get started'
        }
      />

      {/* Quick Stats */}
      {activePuuid && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active PUUID" value="Linked" highlight />
          <StatCard label="Modules" value="4" sub="All active" trend="up" />
          <StatCard label="API Status" value="Live" sub="Riot API connected" trend="up" />
          <StatCard label="Last Updated" value="Now" />
        </div>
      )}

      {/* Module Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {MODULES.map(({ to, icon: Icon, title, description, color, features }) => (
          <Link
            key={to}
            to={to}
            className="card hover:border-border-light transition-all duration-200 hover:-translate-y-0.5 group"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-2.5 rounded-lg border ${colorMap[color]}`}>
                <Icon size={22} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-text-secondary mt-0.5">{description}</p>
              </div>
            </div>
            <ul className="space-y-1">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="w-1 h-1 rounded-full bg-border-light flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  );
}
