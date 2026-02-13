import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useChampions, type Champion } from '@hooks/useChampions';

// ── Single Champion Picker ──────────────────────────────────────────────────
interface ChampionPickerProps {
  label: string;
  value: string;           // champion id e.g. "Jinx"
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChampionPicker({
  label,
  value,
  onChange,
  placeholder = 'Champion wählen…',
  disabled,
}: ChampionPickerProps) {
  const { data: champions = [], isLoading } = useChampions();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = champions.find((c) => c.id === value);

  const filtered = search.trim()
    ? champions.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : champions;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const handleSelect = (champ: Champion) => {
    onChange(champ.id);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="label block mb-1.5">{label}</label>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'w-full flex items-center gap-2.5 bg-background border rounded-lg px-3 py-2 text-sm transition-colors text-left',
          open ? 'border-primary' : 'border-border hover:border-border-light',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {/* Champion icon + name or placeholder */}
        {selected ? (
          <>
            <img
              src={selected.iconUrl}
              alt={selected.name}
              className="w-6 h-6 rounded-md object-cover flex-shrink-0"
              loading="lazy"
            />
            <span className="flex-1 text-text-primary font-medium truncate">
              {selected.name}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-text-muted hover:text-text-secondary transition-colors p-0.5 flex-shrink-0"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-md bg-background-elevated flex-shrink-0" />
            <span className="flex-1 text-text-muted">
              {isLoading ? 'Lade Champions…' : placeholder}
            </span>
            <ChevronDown
              size={14}
              className={clsx('text-text-muted transition-transform flex-shrink-0', open && 'rotate-180')}
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background-elevated border border-border-light rounded-xl shadow-card overflow-hidden animate-fade-in">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suchen…"
                className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Champion Grid */}
          <div className="overflow-y-auto max-h-64 p-2">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-text-muted py-4">
                Kein Champion gefunden für „{search}"
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-1">
                {filtered.map((champ) => (
                  <button
                    key={champ.id}
                    type="button"
                    onClick={() => handleSelect(champ)}
                    title={champ.name}
                    className={clsx(
                      'flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all hover:bg-background-card group',
                      value === champ.id && 'bg-primary/10 ring-1 ring-primary/50',
                    )}
                  >
                    <img
                      src={champ.iconUrl}
                      alt={champ.name}
                      className="w-10 h-10 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <span className="text-[10px] text-text-muted group-hover:text-text-secondary leading-none text-center truncate w-full">
                      {champ.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ── Multi Champion Picker (für Allies / Enemies) ────────────────────────────
interface MultiChampionPickerProps {
  label: string;
  values: string[];        // array of champion ids
  onChange: (ids: string[]) => void;
  maxCount?: number;
  placeholder?: string;
  teamColor?: 'blue' | 'red';
}

export function MultiChampionPicker({
  label,
  values,
  onChange,
  maxCount = 4,
  placeholder = 'Champions hinzufügen…',
  teamColor = 'blue',
}: MultiChampionPickerProps) {
  const { data: champions = [], isLoading } = useChampions();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedChamps = values
    .map((id) => champions.find((c) => c.id === id))
    .filter(Boolean) as Champion[];

  const filtered = champions.filter((c) => {
    if (values.includes(c.id)) return false;
    if (!search.trim()) return true;
    return c.name.toLowerCase().includes(search.toLowerCase());
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const handleAdd = (champ: Champion) => {
    if (values.length >= maxCount) return;
    onChange([...values, champ.id]);
    setSearch('');
    if (values.length + 1 >= maxCount) setOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange(values.filter((v) => v !== id));
  };

  const borderColor = teamColor === 'blue' ? 'border-accent-blue/30' : 'border-accent-red/30';
  const tagColor = teamColor === 'blue'
    ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
    : 'bg-accent-red/10 text-accent-red border-accent-red/20';

  return (
    <div ref={containerRef} className="relative">
      <label className="label block mb-1.5">
        {label}
        <span className="ml-1.5 text-text-muted normal-case font-normal">
          ({values.length}/{maxCount})
        </span>
      </label>

      {/* Selected chips + trigger */}
      <div
        onClick={() => { if (values.length < maxCount) setOpen((o) => !o); }}
        className={clsx(
          'min-h-[40px] w-full flex flex-wrap gap-1.5 bg-background border rounded-lg px-2.5 py-2 cursor-pointer transition-colors',
          open ? 'border-primary' : `border-border hover:border-border-light`,
          values.length >= maxCount && 'cursor-default',
        )}
      >
        {selectedChamps.map((champ) => (
          <div
            key={champ.id}
            className={clsx(
              'flex items-center gap-1 pl-0.5 pr-1.5 py-0.5 rounded-md border text-xs font-medium',
              tagColor,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={champ.iconUrl}
              alt={champ.name}
              className="w-5 h-5 rounded object-cover"
            />
            <span>{champ.name}</span>
            <button
              type="button"
              onClick={() => handleRemove(champ.id)}
              className="opacity-60 hover:opacity-100 ml-0.5"
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {values.length === 0 && (
          <span className="text-text-muted text-sm self-center">
            {isLoading ? 'Lade…' : placeholder}
          </span>
        )}

        {values.length > 0 && values.length < maxCount && (
          <span className="text-text-muted text-xs self-center">
            + hinzufügen
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && values.length < maxCount && (
        <div className={clsx(
          'absolute z-50 top-full left-0 right-0 mt-1 bg-background-elevated border rounded-xl shadow-card overflow-hidden animate-fade-in',
          borderColor,
        )}>
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Champion suchen…"
                className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-56 p-2">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-text-muted py-4">
                {search ? `Kein Treffer für „${search}"` : 'Alle Champions bereits ausgewählt'}
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-1">
                {filtered.map((champ) => (
                  <button
                    key={champ.id}
                    type="button"
                    onClick={() => handleAdd(champ)}
                    title={champ.name}
                    className="flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all hover:bg-background-card group"
                  >
                    <img
                      src={champ.iconUrl}
                      alt={champ.name}
                      className="w-10 h-10 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <span className="text-[10px] text-text-muted group-hover:text-text-secondary leading-none text-center truncate w-full">
                      {champ.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
