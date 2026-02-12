import { Outlet, NavLink } from 'react-router-dom';
import { Brain, BarChart3, AlertTriangle, ShieldAlert, LayoutDashboard } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/draft', label: 'Draft Intelligence', icon: Brain },
  { to: '/performance', label: 'Performance', icon: BarChart3 },
  { to: '/tilt', label: 'Tilt Detection', icon: AlertTriangle },
  { to: '/smurf', label: 'Smurf Detection', icon: ShieldAlert },
];

export function MainLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-background-secondary border-r border-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border">
          <h1 className="font-display text-xl font-bold text-primary tracking-widest uppercase">
            LoL Analytics
          </h1>
          <p className="text-xs text-text-muted mt-0.5">Advanced Intelligence Suite</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
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
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <p className="text-xs text-text-muted">
            Powered by Riot Games API
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
