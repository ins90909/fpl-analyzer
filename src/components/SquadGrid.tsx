'use client';

import { FPLBootstrap, FPLFixture, FPLLiveResponse, ProcessedPlayer } from '@/types/fpl';
import { getUpcomingFixtures, getFDRBadgeColor } from '@/lib/fixtures';

interface SquadGridProps {
  starting11: ProcessedPlayer[];
  bench: ProcessedPlayer[];
  bootstrap?: FPLBootstrap | null;
  fixtures?: FPLFixture[] | null;
  liveData?: FPLLiveResponse | null;
  gameweekFinished?: boolean;
  onPlayerSelect?: (playerId: number) => void;
}

export function SquadGrid({
  starting11,
  bench,
  bootstrap,
  fixtures,
  liveData,
  gameweekFinished = false,
  onPlayerSelect,
}: SquadGridProps) {
  const autoSubstitutions: Array<{ outgoing: ProcessedPlayer; incoming: ProcessedPlayer }> = [];
  if (gameweekFinished && liveData) {
    const minutesById = new Map(liveData.elements.map((player) => [player.id, player.stats.minutes ?? 0]));
    const playing = starting11.filter((player) => (minutesById.get(player.id) ?? 0) > 0);
    const missing = starting11
      .filter((player) => (minutesById.get(player.id) ?? 0) === 0)
      .sort((a, b) => a.squad_position - b.squad_position);
    const availableBench = [...bench]
      .filter((player) => (minutesById.get(player.id) ?? 0) > 0)
      .sort((a, b) => a.squad_position - b.squad_position);

    const formationIsLegal = (players: ProcessedPlayer[]) => {
      const counts = players.reduce(
        (result, player) => {
          result[player.element_type] += 1;
          return result;
        },
        [0, 0, 0, 0, 0]
      );
      return counts[1] <= 1 && counts[2] >= 3 && counts[3] >= 2 && counts[4] >= 1;
    };

    for (const outgoing of missing) {
      const outgoingIndex = playing.findIndex((player) => player.id === outgoing.id);
      const candidates = availableBench.filter((player) =>
        outgoing.element_type === 1
          ? player.element_type === 1
          : player.element_type !== 1
      );
      const incoming = candidates.find((player) => {
        const nextLineup = [
          ...playing.filter((starter) => starter.id !== outgoing.id),
          player,
        ];
        return formationIsLegal(nextLineup);
      });
      if (incoming) {
        if (outgoingIndex >= 0) playing.splice(outgoingIndex, 1);
        playing.push(incoming);
        availableBench.splice(availableBench.findIndex((player) => player.id === incoming.id), 1);
        autoSubstitutions.push({ outgoing, incoming });
      }
    }
  }

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
          {bench.map((player) => (
            <div key={player.id} className="relative">
              <span className="absolute -top-2 left-2 z-10 rounded bg-[#edf4f7] px-1.5 py-0.5 text-[9px] font-bold text-[#648198]">
                {player.element_type === 1 ? 'GK' : `SUB ${player.squad_position - 11}`}
              </span>
              {renderPlayerCard(player)}
            </div>
          ))}
        </div>
        {gameweekFinished && (
          <div className="mt-4 rounded-lg border border-[#c9e0eb] bg-[#f4fbff] p-3 text-sm">
            <h3 className="font-semibold text-[#244764]">Auto-substitution review</h3>
            {autoSubstitutions.length ? (
              <ul className="mt-2 space-y-1 text-xs text-[#648198]">
                {autoSubstitutions.map(({ outgoing, incoming }) => (
                  <li key={`${outgoing.id}-${incoming.id}`}>
                    {outgoing.web_name} missed out → {incoming.web_name} comes on
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-[#7891a3]">
                No legal bench substitutions based on the completed gameweek minutes.
              </p>
            )}
            <p className="mt-2 text-[10px] text-[#7891a3]">
              Estimated from minutes played and formation rules; FPL determines the official auto-subs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
