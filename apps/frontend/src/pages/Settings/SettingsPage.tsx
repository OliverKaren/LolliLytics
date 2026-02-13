import { useState } from 'react';
import {
  CheckCircle, Link2, Link2Off, RefreshCw, ExternalLink,
  Database, Clock, Zap, AlertCircle, ArrowDownCircle,
} from 'lucide-react';
import { SectionHeader, LoadingSpinner } from '@components/common/ui';
import { useAppStore } from '@/store';
import { useLinkRiotAccount, useUnlinkRiotAccount, useCurrentUser } from '@hooks/useAuth';
import { useSyncStatus, useTriggerSync } from '@hooks/useMatchSync';

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

function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return 'Noch nie';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1)   return 'Gerade eben';
  if (mins < 60)  return `vor ${mins} Min.`;
  if (hours < 24) return `vor ${hours} Std.`;
  return `vor ${days} Tag(en)`;
}

export function SettingsPage() {
  const { user } = useAppStore();
  const { data: freshUser } = useCurrentUser();
  const currentUser = freshUser ?? user;

  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [platform, setPlatform] = useState('EUW1');

  const linkMutation    = useLinkRiotAccount();
  const unlinkMutation  = useUnlinkRiotAccount();
  const { data: syncStatus, isLoading: loadingStatus } = useSyncStatus();
  const triggerSync     = useTriggerSync();

  const hasRiotLinked = !!currentUser?.riotPuuid;
  const isSyncing = syncStatus?.state === 'syncing' || triggerSync.isPending;

  const handleLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim() || !tagLine.trim()) return;
    linkMutation.mutate(
      { gameName: gameName.trim(), tagLine: tagLine.trim(), platform },
      { onSuccess: () => { setGameName(''); setTagLine(''); } },
    );
  };

  const handleUnlink = () => {
    if (confirm('Riot Account wirklich trennen? Deine gespeicherten Matches bleiben erhalten.')) {
      unlinkMutation.mutate();
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl space-y-5">
      <SectionHeader
        title="Einstellungen"
        subtitle="Verknüpfe deinen Riot Account und verwalte deine Daten"
      />

      {/* ── App Account ─────────────────────────────────────────────────── */}
      <div className="card">
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

      {/* ── Riot Account ─────────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">Riot Account</h3>
          {hasRiotLinked && (
            <span className="stat-badge-green flex items-center gap-1.5">
              <CheckCircle size={12} /> Verknüpft
            </span>
          )}
        </div>

        {/* Linked account info */}
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
                {unlinkMutation.isPending ? <RefreshCw size={12} className="animate-spin" /> : <Link2Off size={12} />}
                Trennen
              </button>
            </div>
          </div>
        )}

        {/* Errors */}
        {linkMutation.isError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm">
            {(linkMutation.error as any)?.response?.data?.message
              ?? 'Riot Account konnte nicht gefunden werden.'}
          </div>
        )}
        {linkMutation.isSuccess && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green text-sm flex items-center gap-2">
            <CheckCircle size={16} />
            Riot Account erfolgreich verknüpft!
          </div>
        )}

        {/* Link form */}
        <div>
          <p className="text-sm text-text-secondary mb-4">
            {hasRiotLinked ? 'Account ersetzen:' : 'Riot ID eingeben (z. B. OliverKaren#EUW):'}
          </p>

          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-text-secondary">
            <span className="text-primary font-medium">ℹ️ </span>
            Benötigt einen gültigen <code className="text-primary">RIOT_API_KEY</code> in der{' '}
            <code className="text-primary">.env</code>.{' '}
            <a href="https://developer.riotgames.com" target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5">
              API Key holen <ExternalLink size={10} />
            </a>
          </div>

          <form onSubmit={handleLink} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label block mb-1.5">Spielername</label>
                <input
                  type="text" value={gameName} onChange={(e) => setGameName(e.target.value)}
                  placeholder="OliverKaren" required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="label block mb-1.5">Tag (nach #)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">#</span>
                  <input
                    type="text" value={tagLine} onChange={(e) => setTagLine(e.target.value)}
                    placeholder="EUW" required
                    className="w-full bg-background border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label block mb-1.5">Server / Region</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer">
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={linkMutation.isPending || !gameName.trim() || !tagLine.trim()}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
              {linkMutation.isPending
                ? <><LoadingSpinner size={16} /> Wird gesucht…</>
                : <><Link2 size={16} />{hasRiotLinked ? 'Account ersetzen' : 'Riot Account verknüpfen'}</>
              }
            </button>
          </form>
        </div>
      </div>

      {/* ── Match Sync Status ─────────────────────────────────────────────── */}
      {hasRiotLinked && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">Match-Synchronisierung</h3>

            {/* Sync state badge */}
            {syncStatus?.state === 'syncing' && (
              <span className="stat-badge-blue flex items-center gap-1.5">
                <RefreshCw size={11} className="animate-spin" /> Syncing…
              </span>
            )}
            {syncStatus?.state === 'error' && (
              <span className="stat-badge-red flex items-center gap-1.5">
                <AlertCircle size={11} /> Fehler
              </span>
            )}
            {(syncStatus?.state === 'idle' || !syncStatus) && (
              <span className="stat-badge flex items-center gap-1.5">
                <CheckCircle size={11} /> Bereit
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="card-elevated text-center">
              <Database size={16} className="text-primary mx-auto mb-1" />
              <p className="text-2xl font-mono font-bold text-text-primary">
                {syncStatus?.totalMatchesSynced ?? 0}
              </p>
              <p className="label mt-0.5">Gespeicherte Matches</p>
            </div>
            <div className="card-elevated text-center">
              <ArrowDownCircle size={16} className="text-accent-green mx-auto mb-1" />
              <p className="text-2xl font-mono font-bold text-text-primary">
                {syncStatus?.lastSyncAddedCount ?? 0}
              </p>
              <p className="label mt-0.5">Letzter Sync</p>
            </div>
            <div className="card-elevated text-center">
              <Clock size={16} className="text-text-muted mx-auto mb-1" />
              <p className="text-sm font-medium text-text-primary mt-1">
                {formatRelativeTime(syncStatus?.lastSyncedAt ?? null)}
              </p>
              <p className="label mt-0.5">Letzter Sync</p>
            </div>
          </div>

          {/* Error message */}
          {syncStatus?.state === 'error' && syncStatus.lastError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm">
              {syncStatus.lastError}
            </div>
          )}

          {/* Manual trigger */}
          <button
            onClick={() => triggerSync.mutate()}
            disabled={isSyncing}
            className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
          >
            {isSyncing ? (
              <><RefreshCw size={16} className="animate-spin" /> Synchronisiere…</>
            ) : (
              <><Zap size={16} /> Jetzt synchronisieren</>
            )}
          </button>

          {/* Info text */}
          <p className="text-xs text-text-muted mt-3 text-center">
            Automatische Synchronisierung alle 30 Minuten im Hintergrund.
            Du musst die App nicht geöffnet lassen.
          </p>

          {/* Result flash */}
          {triggerSync.isSuccess && triggerSync.data && (
            <div className="mt-3 px-4 py-3 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              Sync abgeschlossen — {triggerSync.data.added} neue Matches hinzugefügt
              {triggerSync.data.skipped > 0 && `, ${triggerSync.data.skipped} bereits vorhanden`}
            </div>
          )}
        </div>
      )}

      {/* Info footer */}
      <div className="p-4 rounded-xl border border-border bg-background-secondary">
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="text-text-secondary font-medium">Wie funktioniert der Sync?</span>{' '}
          LolliLytics lädt automatisch deine letzten Ranked Solo/Duo Matches von der Riot API
          und speichert sie lokal. Du musst die App nicht geöffnet lassen — neue Spiele werden
          beim nächsten automatischen Sync (alle 30 Min.) oder manuell erkannt.
        </p>
      </div>
    </div>
  );
}
