'use client';

import { ProcessedPlayer } from '@/types/fpl';
import { PlayerStatusBadge } from './PlayerStatusBadge';

interface SquadAvailabilityAlertsProps {
  starting11: ProcessedPlayer[];
  bench: ProcessedPlayer[];
}

export function SquadAvailabilityAlerts({ starting11, bench }: SquadAvailabilityAlertsProps) {
  const allPlayers = [...starting11, ...bench];
  const flaggedPlayers = allPlayers.filter(
    (p) => p.status !== 'a' || (p.chance_of_playing_next_round !== null && p.chance_of_playing_next_round < 100)
  );

  if (flaggedPlayers.length === 0) {
    return (
      <div className="p-4 bg-[#e8f7f0] border border-[#bde3d0] rounded-lg flex items-center gap-3 text-[#327a68] text-xs">
        <span><strong>Full Fitness:</strong> No players in your squad currently have injury or international duty flags.</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#fffaf0] border border-[#ead79b] rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#244764] flex items-center gap-2">
          Squad Fitness & Availability ({flaggedPlayers.length} Flagged)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {flaggedPlayers.map((player) => (
          <div
            key={player.id}
            className="p-2.5 bg-white border border-[#e5dcb9] rounded-lg flex items-start gap-2.5"
          >
            <PlayerStatusBadge player={player} showText />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs font-semibold text-[#244764]">
                <span>{player.web_name}</span>
                <span className="text-[10px] text-[#7891a3] font-normal">{player.team_short}</span>
              </div>
              <p className="text-[11px] text-[#7891a3] mt-0.5 line-clamp-2">
                {player.news || 'Status unknown'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}