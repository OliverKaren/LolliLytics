import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  Brain, BarChart3, AlertTriangle, ShieldAlert,
  LayoutDashboard, Settings, LogOut, Link2, Swords, ChevronDown,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { useAppStore } from '@/store';
import { useLogout, useCurrentUser } from '@hooks/useAuth';

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/draft',       label: 'Draft Intelligence',  icon: Brain },
  { to: '/performance', label: 'Performance',         icon: BarChart3 },
  { to: '/tilt',        label: 'Tilt Detection',      icon: AlertTriangle },
  { to: '/smurf',       label: 'Smurf Detection',     icon: ShieldAlert },
];

function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAppStore();
  const logout = useLogout();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-background-card transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary font-display">{initials}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{user?.username}</p>
          <p className="text-xs text-text-muted truncate">{user?.email}</p>
        </div>
        <ChevronDown
          size={14}
          className={clsx('text-text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-background-elevated border border-border-light rounded-xl shadow-card overflow-hidden animate-fade-in z-50">
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-text-secondary hover:bg-background-card hover:text-text-primary transition-colors"
          >
            <Settings size={15} />
            Einstellungen
          </Link>
          <div className="border-t border-border" />
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-accent-red hover:bg-accent-red/5 transition-colors w-full text-left"
          >
            <LogOut size={15} />
            Ausloggen
          </button>
        </div>
      )}
    </div>
  );
}

export function MainLayout() {
  const { user } = useAppStore();
  const { data: freshUser } = useCurrentUser();
  const currentUser = freshUser ?? user;

  const hasRiotLinked = !!currentUser?.riotPuuid;

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-background-secondary border-r border-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Swords size={16} className="text-primary" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold text-primary tracking-widest uppercase leading-none">
                LolliLytics
              </h1>
              <p className="text-[10px] text-text-muted leading-none mt-0.5">Intelligence Suite</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-text-secondary hover:bg-background-card hover:text-text-primary',
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}

          <div className="pt-2 border-t border-border mt-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-text-secondary hover:bg-background-card hover:text-text-primary',
                )
              }
            >
              <Settings size={17} />
              Einstellungen
            </NavLink>
          </div>
        </nav>

        {/* Riot account status */}
        {!hasRiotLinked && (
          <div className="mx-3 mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-primary font-medium mb-1 flex items-center gap-1">
              <Link2 size={11} />
              Riot Account fehlt
            </p>
            <p className="text-[11px] text-text-muted leading-snug mb-2">
              Verknüpfe deinen Riot Account für personalisierte Analysen.
            </p>
            <Link
              to="/settings"
              className="text-[11px] text-primary hover:text-primary-light font-medium underline underline-offset-2"
            >
              Jetzt verknüpfen →
            </Link>
          </div>
        )}

        {hasRiotLinked && (
          <div className="mx-3 mb-3 p-3 rounded-lg bg-accent-green/5 border border-accent-green/20">
            <p className="text-xs text-accent-green font-medium mb-0.5 flex items-center gap-1">
              <Link2 size={11} />
              {currentUser?.riotSummonerName}
            </p>
            <p className="text-[11px] text-text-muted">{currentUser?.riotRegion}</p>
          </div>
        )}

        {/* User menu */}
        <div className="px-3 pb-4 border-t border-border pt-3">
          <UserMenu />
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
