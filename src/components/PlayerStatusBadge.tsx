'use client';

import { ProcessedPlayer, FPLElement } from '@/types/fpl';

interface StatusBadgeProps {
  player: ProcessedPlayer | FPLElement;
  showText?: boolean;
}

export function PlayerStatusBadge({ player, showText = false }: StatusBadgeProps) {
  if (player.status === 'a' && !player.news) return null;

  const newsLower = player.news?.toLowerCase() || '';

  // Determine flag classification
  let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  let label = `${player.chance_of_playing_next_round ?? 50}%`;
  let icon = '⚠️';

  if (player.status === 'i' || player.chance_of_playing_next_round === 0) {
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    label = 'Out';
    icon = '🚑';
  } else if (newsLower.includes('international') || player.status === 'u') {
    badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    label = 'Intl Duty';
    icon = '✈️';
  } else if (player.status === 's') {
    badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    label = 'Suspended';
    icon = '🟥';
  }

  return (
    <div
      title={player.news || 'Player flag status'}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}
    >
      <span>{icon}</span>
      {showText && <span>{label}</span>}
    </div>
  );
}