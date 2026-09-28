'use client';

import { useEffect, useState } from 'react';
import { FPLBootstrap, FPLPlayerSummary } from '@/types/fpl';

interface PlayerDetailsModalProps {
  playerId: number | null;
  bootstrap: FPLBootstrap;
  onClose: () => void;
}

export function PlayerDetailsModal({
  playerId,
  bootstrap,
  onClose,
}: PlayerDetailsModalProps) {
  const [loadedSummary, setLoadedSummary] = useState<{
    id: number;
    summary: FPLPlayerSummary;
  } | null>(null);
  const [loadError, setLoadError] = useState<{ id: number; message: string } | null>(null);
  const player = bootstrap.elements.find((item) => item.id === playerId);
  const team = bootstrap.teams.find((item) => item.id === player?.team);
  const summary = loadedSummary?.id === playerId ? loadedSummary.summary : null;
  const error = loadError?.id === playerId ? loadError.message : null;

  useEffect(() => {
    if (playerId === null) return;
    let active = true;

    fetch(`/api/fpl/players/${playerId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load this player’s gameweek history.');
        return response.json() as Promise<FPLPlayerSummary>;
      })
      .then((data) => {
        if (active) setLoadedSummary({ id: playerId, summary: data });
      })
      .catch((reason: unknown) => {
        if (active) {
          setLoadError({
            id: playerId,
            message: reason instanceof Error ? reason.message : 'Could not load player details.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [playerId]);

  if (playerId === null) return null;

  const recentHistory = summary
    ? [...summary.history].sort((a, b) => b.round - a.round).slice(0, 6)
    : [];
  const upcomingFixtures = summary?.fixtures.filter((fixture) => fixture.event !== null).slice(0, 5) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-detail-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#c9e0eb] bg-[#f4fbff] p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="player-detail-title" className="text-xl font-bold text-[#244764]">
              {player?.web_name ?? `Player ${playerId}`}
            </h2>
            <p className="text-sm text-[#7891a3]">
              {team?.name ?? 'Player details'} · {player?.element_type ? ['','GKP','DEF','MID','FWD'][player.element_type] : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close player details" className="rounded-lg px-3 py-1 text-lg text-[#648198] hover:bg-[#eaf6fb]">
            ×
          </button>
        </div>

        {player && (
          <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-3"><div className="text-xs text-[#7891a3]">Season points</div><div className="font-bold text-[#327a68]">{player.total_points}</div></div>
            <div className="rounded-lg bg-white p-3"><div className="text-xs text-[#7891a3]">Points / game</div><div className="font-bold text-[#244764]">{player.points_per_game}</div></div>
            <div className="rounded-lg bg-white p-3"><div className="text-xs text-[#7891a3]">Form</div><div className="font-bold text-[#244764]">{player.form}</div></div>
            <div className="rounded-lg bg-white p-3"><div className="text-xs text-[#7891a3]">Price</div><div className="font-bold text-[#244764]">£{(player.now_cost / 10).toFixed(1)}m</div></div>
          </div>
        )}

        {error && <p role="alert" className="my-4 text-sm text-[#b45851]">{error}</p>}
        {!summary && !error && <p className="my-4 text-sm text-[#7891a3]">Loading player history…</p>}

        {summary && (
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 font-semibold text-[#244764]">Recent gameweeks</h3>
              <div className="overflow-x-auto rounded-lg border border-[#c9e0eb] bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#e0edf2] text-[#7891a3]">
                    <tr>
                      <th className="p-2">GW</th><th className="p-2">Pts</th><th className="p-2">Min</th>
                      <th className="p-2">G</th><th className="p-2">A</th><th className="p-2">CS</th><th className="p-2">Bonus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0edf2] text-[#244764]">
                    {recentHistory.map((week) => (
                      <tr key={week.round}>
                        <td className="p-2">{week.round}</td><td className="p-2 font-bold text-[#327a68]">{week.total_points}</td>
                        <td className="p-2">{week.minutes}</td><td className="p-2">{week.goals_scored}</td>
                        <td className="p-2">{week.assists}</td><td className="p-2">{week.clean_sheets}</td><td className="p-2">{week.bonus}</td>
                      </tr>
                    ))}
                    {recentHistory.length === 0 && <tr><td colSpan={7} className="p-3 text-[#7891a3]">No completed gameweek stats yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-[#244764]">Upcoming fixtures</h3>
              {upcomingFixtures.length ? (
                <ul className="flex flex-wrap gap-2">
                  {upcomingFixtures.map((fixture) => (
                    <li key={fixture.id} className="rounded-lg border border-[#c9e0eb] bg-white px-3 py-2 text-xs text-[#244764]">
                      GW{fixture.event} · {fixture.is_home ? 'vs' : '@'}{' '}
                      {bootstrap.teams.find((item) => item.id === (fixture.is_home ? fixture.team_a : fixture.team_h))?.short_name ?? 'TBC'}
                      {' · '}FDR {fixture.difficulty}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-[#7891a3]">No upcoming fixtures listed.</p>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
