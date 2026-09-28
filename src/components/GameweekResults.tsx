'use client';

import { FPLBootstrap, FPLLiveResponse, FPLPicksResponse } from '@/types/fpl';

interface GameweekResultsProps {
  gameweek: number;
  picks: FPLPicksResponse;
  liveData: FPLLiveResponse;
  bootstrap: FPLBootstrap;
  onPlayerSelect: (playerId: number) => void;
}

const positions: Record<number, string> = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export function GameweekResults({
  gameweek,
  picks,
  liveData,
  bootstrap,
  onPlayerSelect,
}: GameweekResultsProps) {
  const playerById = new Map(bootstrap.elements.map((player) => [player.id, player]));
  const teamById = new Map(bootstrap.teams.map((team) => [team.id, team.short_name]));
  const pointsById = new Map(liveData.elements.map((player) => [player.id, player.stats.total_points]));
  const startingPicks = picks.picks.filter((pick) => pick.position <= 11);
  const benchPicks = picks.picks.filter((pick) => pick.position > 11);

  const renderPick = (pick: (typeof picks.picks)[number]) => {
    const player = playerById.get(pick.element);
    const points = pointsById.get(pick.element);

    if (!player) {
      return (
        <div key={pick.element} className="p-3 bg-white border border-[#c9e0eb] rounded-lg text-xs text-[#b45851]">
          Player data unavailable for element {pick.element}.
        </div>
      );
    }

    const countedPoints = points === undefined ? undefined : points * pick.multiplier;

    return (
      <div
        key={pick.element}
        className="p-3 bg-white border border-[#c9e0eb] rounded-lg flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-[#e8f7f0] text-[#327a68] border border-[#bde3d0]">
              {positions[player.element_type] || 'PLY'}
            </span>
            <button
              type="button"
              onClick={() => onPlayerSelect(player.id)}
              className="font-bold text-sm text-[#244764] truncate text-left hover:underline"
            >
              {player.web_name}
            </button>
            {pick.is_captain && (
              <span className="text-[10px] font-black text-[#8a671c] bg-[#fff4d6] border border-[#ead79b] rounded px-1">(C)</span>
            )}
            {pick.is_vice_captain && (
              <span className="text-[10px] font-black text-[#648198] bg-[#edf4f7] border border-[#c9e0eb] rounded px-1">(VC)</span>
            )}
          </div>
          <div className="text-[11px] text-[#7891a3] mt-1">
            {teamById.get(player.team) || 'UNK'}
            {points === undefined ? ' · points unavailable' : ` · ${points} pts${pick.multiplier > 1 ? ` × ${pick.multiplier}` : ''}`}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-[#327a68]">
            {countedPoints === undefined ? '—' : countedPoints}
          </div>
          <div className="text-[10px] text-[#7891a3]">counted pts</div>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6" aria-label={`Gameweek ${gameweek} results`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[#eaf6fb] border border-[#c9e0eb] rounded-lg">
          <div className="text-xs font-semibold text-[#4d8ca8] mb-1">Gameweek {gameweek} points</div>
          <div className="text-2xl font-bold text-[#327a68]">{picks.entry_history.points}</div>
          <div className="text-xs text-[#7891a3] mt-1">Official total, including autosubs and chips</div>
        </div>
        <div className="p-5 bg-white border border-[#c9e0eb] rounded-lg">
          <div className="text-xs font-semibold text-[#7891a3] mb-1">Overall points</div>
          <div className="text-2xl font-bold text-[#244764]">{picks.entry_history.total_points}</div>
        </div>
        <div className="p-5 bg-white border border-[#c9e0eb] rounded-lg">
          <div className="text-xs font-semibold text-[#7891a3] mb-1">Overall rank</div>
          <div className="text-2xl font-bold text-[#244764]">
            {picks.entry_history.overall_rank.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-[#eaf6fb] border border-[#c9e0eb] rounded-lg p-6">
        <h2 className="text-lg font-bold text-[#244764] mb-4">
          Starting XI <span className="text-xs font-normal text-[#7891a3]">(submitted picks)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {startingPicks.map(renderPick)}
        </div>
      </div>

      <div className="bg-white border border-[#c9e0eb] rounded-lg p-6">
        <h2 className="text-lg font-bold text-[#244764] mb-4">Bench</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {benchPicks.map(renderPick)}
        </div>
      </div>
    </section>
  );
}
