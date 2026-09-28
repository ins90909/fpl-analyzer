'use client';

import { createContext, ReactNode, useContext, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'fpl-watchlist';
const EMPTY_WATCHLIST: WatchlistEntry[] = [];
let cachedSerialized = '';
let cachedWatchlist: WatchlistEntry[] = EMPTY_WATCHLIST;
const listeners = new Set<() => void>();

export interface WatchlistEntry {
  playerId: number;
  priceTarget: number | null;
  alertAvailability: boolean;
}

export interface WatchlistAlertSettings {
  priceTarget: number | null;
  alertAvailability: boolean;
}

function normalizeWatchlist(value: unknown): WatchlistEntry[] {
  if (!Array.isArray(value)) return EMPTY_WATCHLIST;
  const byId = new Map<number, WatchlistEntry>();

  for (const item of value) {
    if (Number.isInteger(item) && item > 0) {
      byId.set(item, { playerId: item, priceTarget: null, alertAvailability: true });
    } else if (
      item &&
      typeof item === 'object' &&
      'playerId' in item &&
      typeof item.playerId === 'number' &&
      Number.isInteger(item.playerId) &&
      item.playerId > 0
    ) {
      byId.set(item.playerId, {
        playerId: item.playerId,
        priceTarget:
          'priceTarget' in item &&
          typeof item.priceTarget === 'number' &&
          Number.isFinite(item.priceTarget)
            ? item.priceTarget
            : null,
        alertAvailability: !('alertAvailability' in item) || item.alertAvailability !== false,
      });
    }
  }

  return [...byId.values()];
}

function getSnapshot(): WatchlistEntry[] {
  const serialized = window.localStorage.getItem(STORAGE_KEY) ?? '[]';
  if (serialized !== cachedSerialized) {
    cachedSerialized = serialized;
    try {
      cachedWatchlist = normalizeWatchlist(JSON.parse(serialized));
    } catch {
      cachedWatchlist = EMPTY_WATCHLIST;
    }
  }
  return cachedWatchlist;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function saveWatchlist(next: WatchlistEntry[]) {
  const serialized = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  cachedSerialized = serialized;
  cachedWatchlist = next;
  listeners.forEach((listener) => listener());
}

const WatchlistContext = createContext<{
  entries: WatchlistEntry[];
  playerIds: number[];
  togglePlayer: (id: number) => void;
  updateAlerts: (id: number, settings: WatchlistAlertSettings) => void;
} | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const entries = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_WATCHLIST);
  const playerIds = entries.map((entry) => entry.playerId);

  const togglePlayer = (id: number) => {
    const current = getSnapshot();
    saveWatchlist(
      current.some((entry) => entry.playerId === id)
        ? current.filter((entry) => entry.playerId !== id)
        : [...current, { playerId: id, priceTarget: null, alertAvailability: true }]
    );
  };

  const updateAlerts = (id: number, settings: WatchlistAlertSettings) => {
    const current = getSnapshot();
    if (!current.some((entry) => entry.playerId === id)) return;
    saveWatchlist(
      current.map((entry) => (entry.playerId === id ? { ...entry, ...settings } : entry))
    );
  };

  return (
    <WatchlistContext.Provider value={{ entries, playerIds, togglePlayer, updateAlerts }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) throw new Error('useWatchlist must be used within WatchlistProvider.');
  return context;
}
