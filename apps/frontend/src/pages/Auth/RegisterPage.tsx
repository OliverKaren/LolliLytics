import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Swords } from 'lucide-react';
import { useRegister } from '@hooks/useAuth';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const register = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 8) {
      setFormError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (password !== confirm) {
      setFormError('Die Passwörter stimmen nicht überein.');
      return;
    }
    register.mutate({ email, username, password });
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-4"
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
          <h2 className="font-display text-xl font-semibold text-text-primary mb-1">
            Konto erstellen
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            Nach der Registrierung kannst du deinen Riot Account verknüpfen.
          </p>

          {/* Errors */}
          {(formError || register.isError) && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm">
              {formError || (register.error as any)?.response?.data?.message || 'Registrierung fehlgeschlagen.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="label block mb-1.5">Benutzername</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="dein_name"
                autoComplete="username"
                minLength={3}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="label block mb-1.5">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 8 Zeichen"
                  autoComplete="new-password"
                  required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label block mb-1.5">Passwort bestätigen</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className={`w-full bg-background border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors ${
                  confirm && confirm !== password
                    ? 'border-accent-red focus:border-accent-red'
                    : 'border-border focus:border-primary'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={register.isPending}
              className="w-full btn-primary py-2.5 mt-2"
            >
              {register.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-background/40 border-t-background animate-spin" />
                  Konto wird erstellt…
                </span>
              ) : (
                'Konto erstellen'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Bereits registriert?{' '}
            <Link to="/login" className="text-primary hover:text-primary-light transition-colors">
              Einloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
