'use client';

import { FPLBootstrap, FPLFixture, ProcessedPlayer } from '@/types/fpl';
import { getUpcomingFixtures, getFDRBadgeColor } from '@/lib/fixtures';

interface SquadGridProps {
  starting11: ProcessedPlayer[];
  bench: ProcessedPlayer[];
  bootstrap?: FPLBootstrap | null;
  fixtures?: FPLFixture[] | null;
  onPlayerSelect?: (playerId: number) => void;
}

export function SquadGrid({ starting11, bench, bootstrap, fixtures, onPlayerSelect }: SquadGridProps) {
  const renderPlayerCard = (player: ProcessedPlayer & { team_id?: number }) => {
    const teamId = player.team || player.team_id || 0;
    const upcoming =
      bootstrap && fixtures && Array.isArray(fixtures) && teamId > 0
        ? getUpcomingFixtures(teamId, fixtures, bootstrap, 3)
        : [];

    return (
      <div
        key={player.id}
        className="p-3 bg-white border border-[#c9e0eb] rounded-lg hover:border-[#78c8ab] transition-all shadow-sm flex flex-col justify-between min-h-[125px]"
      >
        <div>
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-[#e8f7f0] text-[#327a68] border border-[#bde3d0]">
              {player.position_short || 'PLY'}
            </span>
            <span className="text-xs font-semibold text-[#7891a3]">{player.team_short}</span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => onPlayerSelect?.(player.id)}
              className="text-left font-bold text-[#244764] text-sm truncate hover:underline"
              title={`View ${player.web_name} details`}
            >
              {player.web_name}
            </button>

            {player.is_captain && (
              <span className="px-1.5 py-0.5 text-[10px] font-black bg-[#fff4d6] text-[#8a671c] border border-[#ead79b] rounded shrink-0">
                (C)
              </span>
            )}

            {player.is_vice_captain && (
              <span className="px-1.5 py-0.5 text-[10px] font-black bg-[#edf4f7] text-[#648198] border border-[#c9e0eb] rounded shrink-0">
                (VC)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 my-2 min-h-[22px]">
          {upcoming.length > 0 ? (
            upcoming.map((fix, idx) => (
              <span
                key={idx}
                className={`text-[9px] font-bold px-1 py-0.5 rounded border flex-1 text-center truncate ${getFDRBadgeColor(
                  fix.difficulty
                )}`}
                title={`GW${fix.event}: vs ${fix.opponentShort} (${fix.isHome ? 'H' : 'A'}) - FDR ${fix.difficulty}`}
              >
                {fix.opponentShort}({fix.isHome ? 'H' : 'A'})
              </span>
            ))
          ) : (
            <span className="text-[10px] text-[#8aa4b5] italic">No fixture data</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#e0edf2] text-xs">
          <span className="text-[#7891a3]">£{((player.now_cost || 0) / 10).toFixed(1)}m</span>
          <span className="text-[#327a68] font-bold">
            {player.expected_score ?? player.ep_next ?? 0} xP
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#eaf6fb] border border-[#c9e0eb] rounded-lg p-6">
        <h2 className="text-lg font-bold text-[#244764] mb-4 flex items-center gap-2">
          <span>Starting XI</span>
          <span className="text-xs font-normal text-[#7891a3]">(11 Players)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {starting11.map(renderPlayerCard)}
        </div>
      </div>

      <div className="bg-white border border-[#c9e0eb] rounded-lg p-6">
        <h2 className="text-lg font-bold text-[#244764] mb-4 flex items-center gap-2">
          <span>Bench</span>
          <span className="text-xs font-normal text-[#7891a3]">(4 Subs)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {bench.map(renderPlayerCard)}
        </div>
      </div>
    </div>
  );
}
