'use client';

import { FPLBootstrap, FPLTeam, FPLElement } from '@/types/fpl';

interface PriceChangeTrackerProps {
  bootstrap: FPLBootstrap;
}

export function PriceChangeTracker({ bootstrap }: PriceChangeTrackerProps) {
  const teamsMap = new Map<number, string>(
    bootstrap.teams.map((t: FPLTeam) => [t.id, t.short_name])
  );

  const risers = [...bootstrap.elements]
    .filter((player: FPLElement) => player.transfers_in_event > 0)
    .sort((a: FPLElement, b: FPLElement) => b.transfers_in_event - a.transfers_in_event)
    .slice(0, 5);

  const fallers = [...bootstrap.elements]
    .filter((player: FPLElement) => player.transfers_out_event > 0)
    .sort((a: FPLElement, b: FPLElement) => b.transfers_out_event - a.transfers_out_event)
    .slice(0, 5);

  return (
    <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
        <span>📈</span> Price Change Radar
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risers */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-emerald-400">High Demand (Potential Risers)</div>
          {risers.map((player: FPLElement) => (
            <div key={player.id} className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-slate-200">{player.web_name}</span>
                <span className="text-[10px] text-slate-400 ml-1.5">{teamsMap.get(player.team)}</span>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 font-semibold">+{player.transfers_in_event.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400">£{(player.now_cost / 10).toFixed(1)}m</div>
              </div>
            </div>
          ))}
        </div>

        {/* Fallers */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-rose-400">High Ownership Loss (Potential Fallers)</div>
          {fallers.map((player: FPLElement) => (
            <div key={player.id} className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-slate-200">{player.web_name}</span>
                <span className="text-[10px] text-slate-400 ml-1.5">{teamsMap.get(player.team)}</span>
              </div>
              <div className="text-right">
                <div className="text-rose-400 font-semibold">-{player.transfers_out_event.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400">£{(player.now_cost / 10).toFixed(1)}m</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}