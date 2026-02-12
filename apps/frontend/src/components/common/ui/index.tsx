import clsx from 'clsx';

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
  className?: string;
}

export function StatCard({ label, value, sub, trend, highlight, className }: StatCardProps) {
  return (
    <div
      className={clsx(
        'card flex flex-col gap-1',
        highlight && 'border-primary/40 shadow-glow',
        className,
      )}
    >
      <span className="label">{label}</span>
      <span className={clsx(
        'text-2xl font-semibold font-mono',
        highlight ? 'text-primary' : 'text-text-primary',
      )}>
        {value}
      </span>
      {sub && (
        <span className={clsx(
          'text-xs',
          trend === 'up' ? 'text-accent-green' :
          trend === 'down' ? 'text-accent-red' :
          'text-text-muted',
        )}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {sub}
        </span>
      )}
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number; // 0-100
  color?: 'gold' | 'blue' | 'green' | 'red' | 'purple';
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({ value, color = 'gold', label, showValue = true }: ProgressBarProps) {
  const colorMap = {
    gold: 'bg-primary',
    blue: 'bg-accent-blue',
    green: 'bg-accent-green',
    red: 'bg-accent-red',
    purple: 'bg-accent-purple',
  };

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-secondary">{label}</span>
          {showValue && <span className="text-xs font-mono text-text-primary">{Math.round(value)}%</span>}
        </div>
      )}
      <div className="h-1.5 bg-background rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', colorMap[color])}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

// ── ScoreBadge ────────────────────────────────────────────────────────────────
interface ScoreBadgeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const color =
    score >= 70 ? 'text-accent-green border-accent-green/30' :
    score >= 40 ? 'text-primary border-primary/30' :
    'text-accent-red border-accent-red/30';

  const sizeClass =
    size === 'lg' ? 'text-3xl w-20 h-20' :
    size === 'md' ? 'text-xl w-14 h-14' :
    'text-sm w-10 h-10';

  return (
    <div className={clsx(
      'rounded-full border-2 flex items-center justify-center font-mono font-bold',
      color,
      sizeClass,
    )}>
      {Math.round(score)}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-text-primary tracking-wide">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <div
        className="rounded-full border-2 border-primary/20 border-t-primary animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

// ── RiskBadge ────────────────────────────────────────────────────────────────
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export function RiskBadge({ level }: { level: RiskLevel }) {
  const config = {
    LOW: { label: 'Low Risk', className: 'stat-badge-green' },
    MEDIUM: { label: 'Medium Risk', className: 'stat-badge-gold' },
    HIGH: { label: 'High Risk', className: 'stat-badge-red' },
    CRITICAL: { label: 'Critical', className: 'bg-accent-red/20 text-accent-red stat-badge animate-pulse' },
  };

  const { label, className } = config[level];
  return <span className={clsx('stat-badge', className)}>{label}</span>;
}
