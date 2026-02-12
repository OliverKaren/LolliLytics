import { useState } from 'react';
import { CheckCircle, Link2, Link2Off, RefreshCw, ExternalLink } from 'lucide-react';
import { SectionHeader, LoadingSpinner } from '@components/common/ui';
import { useAppStore } from '@/store';
import { useLinkRiotAccount, useUnlinkRiotAccount, useCurrentUser } from '@hooks/useAuth';

// All supported platforms with display names
const PLATFORMS = [
  { value: 'EUW1',  label: 'EUW — Europe West' },
  { value: 'EUN1',  label: 'EUNE — Europe Nordic & East' },
  { value: 'NA1',   label: 'NA — North America' },
  { value: 'KR',    label: 'KR — Korea' },
  { value: 'BR1',   label: 'BR — Brazil' },
  { value: 'LA1',   label: 'LAN — Latin America North' },
  { value: 'LA2',   label: 'LAS — Latin America South' },
  { value: 'JP1',   label: 'JP — Japan' },
  { value: 'OC1',   label: 'OCE — Oceania' },
  { value: 'TR1',   label: 'TR — Turkey' },
  { value: 'RU',    label: 'RU — Russia' },
];

export function SettingsPage() {
  const { user } = useAppStore();
  const { data: freshUser, isLoading: loadingUser } = useCurrentUser();
  const currentUser = freshUser ?? user;

  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [platform, setPlatform] = useState('EUW1');

  const linkMutation = useLinkRiotAccount();
  const unlinkMutation = useUnlinkRiotAccount();

  const hasRiotLinked = !!currentUser?.riotPuuid;

  const handleLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim() || !tagLine.trim()) return;
    linkMutation.mutate(
      { gameName: gameName.trim(), tagLine: tagLine.trim(), platform },
      {
        onSuccess: () => {
          setGameName('');
          setTagLine('');
        },
      },
    );
  };

  const handleUnlink = () => {
    if (confirm('Riot Account wirklich trennen?')) {
      unlinkMutation.mutate();
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <SectionHeader
        title="Einstellungen"
        subtitle="Verknüpfe deinen Riot Account für personalisierte Analysen"
      />

      {/* ── Account Info ──────────────────────────────────────────────── */}
      <div className="card mb-5">
        <h3 className="section-title mb-4">App-Konto</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="label mb-1">Benutzername</p>
            <p className="text-text-primary font-medium">{currentUser?.username ?? '—'}</p>
          </div>
          <div>
            <p className="label mb-1">E-Mail</p>
            <p className="text-text-primary font-medium">{currentUser?.email ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* ── Riot Account ──────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">Riot Account</h3>
          {hasRiotLinked && (
            <span className="stat-badge-green flex items-center gap-1.5">
              <CheckCircle size={12} />
              Verknüpft
            </span>
          )}
        </div>

        {/* Currently linked account */}
        {hasRiotLinked && (
          <div className="mb-6 p-4 rounded-xl bg-background border border-accent-green/20">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="label mb-1">Verknüpfter Account</p>
                <p className="text-lg font-semibold text-text-primary truncate">
                  {currentUser?.riotSummonerName}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-text-muted">
                    Region: <span className="text-primary">{currentUser?.riotRegion}</span>
                  </span>
                  <span className="text-xs text-text-muted font-mono truncate max-w-[200px]">
                    PUUID: {currentUser?.riotPuuid?.slice(0, 16)}…
                  </span>
                </div>
              </div>
              <button
                onClick={handleUnlink}
                disabled={unlinkMutation.isPending}
                className="flex items-center gap-1.5 text-xs text-accent-red border border-accent-red/30 hover:bg-accent-red/10 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
              >
                {unlinkMutation.isPending ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Link2Off size={12} />
                )}
                Trennen
              </button>
            </div>
          </div>
        )}

        {/* Linking form */}
        <div>
          <p className="text-sm text-text-secondary mb-4">
            {hasRiotLinked
              ? 'Du kannst deinen Account durch einen anderen ersetzen:'
              : 'Gib deinen Riot-Namen ein (z. B. OliverKaren#EUW):'}
          </p>

          {/* API Key hint */}
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-text-secondary">
            <span className="text-primary font-medium">ℹ️ Hinweis:</span> Die Verknüpfung nutzt die offizielle Riot Games API.
            Stelle sicher, dass dein <code className="text-primary">RIOT_API_KEY</code> in der <code className="text-primary">.env</code> konfiguriert ist.{' '}
            <a
              href="https://developer.riotgames.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              API Key holen <ExternalLink size={10} />
            </a>
          </div>

          {/* Errors */}
          {linkMutation.isError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm">
              {(linkMutation.error as any)?.response?.data?.message
                ?? 'Riot Account konnte nicht gefunden werden. Überprüfe Namen und Region.'}
            </div>
          )}

          {/* Success flash */}
          {linkMutation.isSuccess && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              Riot Account erfolgreich verknüpft! Alle Analysen sind jetzt auf dich zugeschnitten.
            </div>
          )}

          <form onSubmit={handleLink} className="space-y-4">
            {/* Riot ID row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label block mb-1.5">Spielername</label>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="OliverKaren"
                  required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="label block mb-1.5">Tag (nach #)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">#</span>
                  <input
                    type="text"
                    value={tagLine}
                    onChange={(e) => setTagLine(e.target.value)}
                    placeholder="EUW"
                    required
                    className="w-full bg-background border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Platform / Region */}
            <div>
              <label className="label block mb-1.5">Server / Region</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={linkMutation.isPending || !gameName.trim() || !tagLine.trim()}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
            >
              {linkMutation.isPending ? (
                <>
                  <LoadingSpinner size={16} />
                  Wird gesucht…
                </>
              ) : (
                <>
                  <Link2 size={16} />
                  {hasRiotLinked ? 'Account ersetzen' : 'Riot Account verknüpfen'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-5 p-4 rounded-xl border border-border bg-background-secondary">
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="text-text-secondary font-medium">Wie funktioniert das?</span>{' '}
          LolliLytics speichert deinen Riot PUUID und lädt deine Match-History über die offizielle Riot API.
          Deine Daten werden ausschließlich für die Analyse-Features genutzt.
          Der App-Account (E-Mail/Passwort) ist unabhängig vom Riot Account und nur für die LolliLytics-App.
        </p>
      </div>
    </div>
  );
}
