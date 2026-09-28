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
  let badgeColor = 'bg-[#fff4d6] text-[#8a671c] border-[#ead79b]';
  let label = `${player.chance_of_playing_next_round ?? 50}%`;

  if (player.status === 'i' || player.chance_of_playing_next_round === 0) {
    badgeColor = 'bg-[#fff0ef] text-[#b45851] border-[#efc8c4]';
    label = 'Out';
  } else if (newsLower.includes('international') || player.status === 'u') {
    badgeColor = 'bg-[#eaf6fb] text-[#397b98] border-[#c9e0eb]';
    label = 'Intl Duty';
  } else if (player.status === 's') {
    badgeColor = 'bg-[#edf4f7] text-[#648198] border-[#c9e0eb]';
    label = 'Suspended';
  }

  return (
    <div
      title={player.news || 'Player flag status'}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}
    >
      {showText && <span>{label}</span>}
    </div>
  );
}