'use client';

import { FPLElement, FPLBootstrap, FPLFixture } from '@/types/fpl';
import { getUpcomingFixtures, getFDRBadgeColor } from '@/lib/fixtures';

interface SquadGridProps {
  starting11: (FPLElement & { expected_score?: number; position_short?: string; team_short?: string })[];
  bench: (FPLElement & { expected_score?: number; position_short?: string; team_short?: string })[];
  bootstrap?: FPLBootstrap | null;
  fixtures?: FPLFixture[] | null;
}

export function SquadGrid({ starting11, bench, bootstrap, fixtures }: SquadGridProps) {
  const renderPlayerCard = (
    player: FPLElement & { expected_score?: number; position_short?: string; team_short?: string; team_id?: number }
  ) => {
    const teamId = player.team || player.team_id || 0;
    const upcoming =
      bootstrap && fixtures && Array.isArray(fixtures) && teamId > 0
        ? getUpcomingFixtures(teamId, fixtures, bootstrap, 3)
        : [];

    return (
      <div
        key={player.id}
        className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-all shadow-md flex flex-col justify-between min-h-[125px]"
      >
        <div>
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
              {player.position_short || 'PLY'}
            </span>
            <span className="text-xs font-semibold text-slate-400">{player.team_short}</span>
          </div>
          <div className="font-bold text-slate-100 text-sm truncate" title={player.web_name}>
            {player.web_name}
          </div>
        </div>

        {/* Upcoming Fixtures FDR Badges */}
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
            <span className="text-[10px] text-slate-600 italic">No fixture data</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400">£{((player.now_cost || 0) / 10).toFixed(1)}m</span>
          <span className="text-emerald-400 font-bold">
            {player.expected_score ?? player.ep_next ?? 0} xP
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>Starting XI</span>
          <span className="text-xs font-normal text-slate-400">(11 Players)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {starting11.map(renderPlayerCard)}
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span>Bench</span>
          <span className="text-xs font-normal text-slate-500">(4 Subs)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {bench.map(renderPlayerCard)}
        </div>
      </div>
    </div>
  );
}