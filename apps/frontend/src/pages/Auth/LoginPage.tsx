import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Swords } from 'lucide-react';
import { useLogin } from '@hooks/useAuth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    login.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 25% 25%, rgba(200,155,60,0.06) 0%, transparent 55%),
          radial-gradient(ellipse at 75% 75%, rgba(11,196,227,0.05) 0%, transparent 55%)
        `,
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
            <Swords size={28} className="text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary tracking-widest uppercase">
            LolliLytics
          </h1>
          <p className="text-text-secondary text-sm mt-1">Advanced Intelligence Suite</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-6">
            Willkommen zurück
          </h2>

          {/* Error */}
          {login.isError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm">
              {(login.error as any)?.response?.data?.message ?? 'Login fehlgeschlagen. Bitte überprüfe deine Eingaben.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label block mb-1.5">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                autoComplete="email"
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="label block mb-1.5">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={login.isPending}
              className="w-full btn-primary py-2.5 mt-2"
            >
              {login.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-background/40 border-t-background animate-spin" />
                  Einloggen…
                </span>
              ) : (
                'Einloggen'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Noch kein Konto?{' '}
            <Link to="/register" className="text-primary hover:text-primary-light transition-colors">
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
