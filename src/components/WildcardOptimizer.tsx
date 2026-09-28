'use client';

import { FPLBootstrap, FPLTeam, FPLElement } from '@/types/fpl';

interface WildcardOptimizerProps {
  bootstrap: FPLBootstrap;
}

export function WildcardOptimizer({ bootstrap }: WildcardOptimizerProps) {
  const teamsMap = new Map<number, string>(
    bootstrap.teams.map((t: FPLTeam) => [t.id, t.short_name])
  );

  const topFormPlayers = [...bootstrap.elements]
    .sort((a: FPLElement, b: FPLElement) => parseFloat(b.form) - parseFloat(a.form))
    .slice(0, 5);

  return (
    <div className="p-5 bg-white border border-[#c9e0eb] rounded-lg space-y-4">
      <h3 className="text-sm font-bold text-[#244764] flex items-center gap-2">
        Wildcard Essentials
      </h3>
      <div className="space-y-2">
        {topFormPlayers.map((player: FPLElement) => (
          <div key={player.id} className="p-2.5 bg-[#f4fbff] border border-[#e0edf2] rounded-lg flex justify-between items-center text-xs">
            <div>
              <div className="font-semibold text-[#244764]">{player.web_name}</div>
              <div className="text-[10px] text-[#7891a3]">
                {teamsMap.get(player.team)} • £{(player.now_cost / 10).toFixed(1)}m
              </div>
            </div>
            <div className="text-right">
              <div className="text-[#327a68] font-bold">{player.form} form</div>
              <div className="text-[10px] text-[#7891a3]">{player.total_points} pts</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}