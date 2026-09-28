'use client';

import { useEffect, useState } from 'react';
import { FPLBootstrap, FPLPlayerSummary } from '@/types/fpl';
import { useWatchlist } from './WatchlistProvider';

interface PlayerDetailsModalProps {
  playerId: number | null;
  bootstrap: FPLBootstrap;
  onClose: () => void;
  onPlayerSelect: (playerId: number) => void;
}

type PlayerHistoryStatKey =
  | 'total_points'
  | 'minutes'
  | 'goals_scored'
  | 'assists'
  | 'clean_sheets'
  | 'goals_conceded'
  | 'bonus'
  | 'saves'
  | 'penalties_saved'
  | 'defensive_contribution'
  | 'tackles'
  | 'key_passes'
  | 'expected_goals'
  | 'expected_assists'
  | 'expected_goal_involvements';

interface PlayerHistoryStat {
  label: string;
  key: PlayerHistoryStatKey;
  shortLabel: string;
}

function formatStatValue(value: number | string | undefined, isExpected: boolean) {
  if (value === undefined || value === null || value === '') return '—';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '—';
  return isExpected ? numericValue.toFixed(1) : numericValue;
}

function getPlayerHistoryStats(elementType?: number): PlayerHistoryStat[] {
  const common: PlayerHistoryStat[] = [
    { label: 'Pts', key: 'total_points', shortLabel: 'Pts' },
    { label: 'Min', key: 'minutes', shortLabel: 'Min' },
  ];

  switch (elementType) {
    case 1:
      return [
        ...common,
        { label: 'Saves', key: 'saves', shortLabel: 'Saves' },
        { label: 'Goals conceded', key: 'goals_conceded', shortLabel: 'GC' },
        { label: 'Clean sheets', key: 'clean_sheets', shortLabel: 'CS' },
        { label: 'Penalties saved', key: 'penalties_saved', shortLabel: 'PS' },
        { label: 'Bonus', key: 'bonus', shortLabel: 'Bonus' },
      ];
    case 2:
      return [
        ...common,
        { label: 'Goals', key: 'goals_scored', shortLabel: 'G' },
        { label: 'Assists', key: 'assists', shortLabel: 'A' },
        { label: 'Clean sheets', key: 'clean_sheets', shortLabel: 'CS' },
        { label: 'Goals conceded', key: 'goals_conceded', shortLabel: 'GC' },
        { label: 'Defensive contributions', key: 'defensive_contribution', shortLabel: 'Def cons' },
        { label: 'Tackles', key: 'tackles', shortLabel: 'Tkl' },
        { label: 'Bonus', key: 'bonus', shortLabel: 'Bonus' },
        { label: 'Expected goal involvements', key: 'expected_goal_involvements', shortLabel: 'xGI' },
      ];
    case 4:
      return [
        ...common,
        { label: 'Goals', key: 'goals_scored', shortLabel: 'G' },
        { label: 'Assists', key: 'assists', shortLabel: 'A' },
        { label: 'Bonus', key: 'bonus', shortLabel: 'Bonus' },
        { label: 'Expected goals', key: 'expected_goals', shortLabel: 'xG' },
        { label: 'Expected assists', key: 'expected_assists', shortLabel: 'xA' },
        { label: 'Expected goal involvements', key: 'expected_goal_involvements', shortLabel: 'xGI' },
      ];
    case 3:
    default:
      return [
        ...common,
        { label: 'Goals', key: 'goals_scored', shortLabel: 'G' },
        { label: 'Assists', key: 'assists', shortLabel: 'A' },
        { label: 'Clean sheets', key: 'clean_sheets', shortLabel: 'CS' },
        { label: 'Defensive contributions', key: 'defensive_contribution', shortLabel: 'Def cons' },
        { label: 'Key passes', key: 'key_passes', shortLabel: 'KP' },
        { label: 'Bonus', key: 'bonus', shortLabel: 'Bonus' },
        { label: 'Expected goals', key: 'expected_goals', shortLabel: 'xG' },
        { label: 'Expected assists', key: 'expected_assists', shortLabel: 'xA' },
        { label: 'Expected goal involvements', key: 'expected_goal_involvements', shortLabel: 'xGI' },
      ];
  }
}

export function PlayerDetailsModal({
  playerId,
  bootstrap,
  onClose,
  onPlayerSelect,
}: PlayerDetailsModalProps) {
  const [loadedSummary, setLoadedSummary] = useState<{
    id: number;
    summary: FPLPlayerSummary;
  } | null>(null);
  const [loadError, setLoadError] = useState<{ id: number; message: string } | null>(null);
  const { entries, togglePlayer, updateAlerts } = useWatchlist();
  const player = bootstrap.elements.find((item) => item.id === playerId);
  const team = bootstrap.teams.find((item) => item.id === player?.team);
  const watchlistEntry = entries.find((entry) => entry.playerId === playerId);
  const isWatched = watchlistEntry !== undefined;
  const comparablePlayers = player
    ? bootstrap.elements
        .filter(
          (candidate) =>
            candidate.id !== player.id &&
            candidate.element_type === player.element_type &&
            candidate.status === 'a' &&
            Math.abs(candidate.now_cost - player.now_cost) <= 10
        )
        .sort(
          (a, b) =>
            (Number.parseFloat(b.points_per_game) || 0) -
            (Number.parseFloat(a.points_per_game) || 0)
        )
        .slice(0, 3)
    : [];
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
  const historyStats = getPlayerHistoryStats(player?.element_type);
  const seasonStats = historyStats.slice(2).map((stat) => ({
    ...stat,
    value: summary?.history.reduce(
      (total, week) => total + Number(week[stat.key] ?? 0),
      0
    ) ?? 0,
  }));

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => togglePlayer(playerId)}
              className="rounded-lg border border-[#c9e0eb] px-3 py-1.5 text-xs font-semibold text-[#327a68] hover:bg-[#eaf6fb]"
            >
              {isWatched ? '★ Watching' : '☆ Add to watchlist'}
            </button>
            <button type="button" onClick={onClose} aria-label="Close player details" className="rounded-lg px-3 py-1 text-lg text-[#648198] hover:bg-[#eaf6fb]">
              ×
            </button>
          </div>
        </div>

        {player && (
          <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-3"><div className="text-xs text-[#7891a3]">Season points</div><div className="font-bold text-[#327a68]">{player.total_points}</div></div>
            <div className="rounded-lg bg-white p-3"><div className="text-xs text-[#7891a3]">Points / game</div><div className="font-bold text-[#244764]">{player.points_per_game}</div></div>
            <div className="rounded-lg bg-white p-3"><div className="text-xs text-[#7891a3]">Form</div><div className="font-bold text-[#244764]">{player.form}</div></div>
            <div className="rounded-lg bg-white p-3"><div className="text-xs text-[#7891a3]">Price</div><div className="font-bold text-[#244764]">£{(player.now_cost / 10).toFixed(1)}m</div></div>
          </div>
        )}

        {isWatched && watchlistEntry && (
          <fieldset className="mb-4 rounded-lg border border-[#c9e0eb] bg-white p-3">
            <legend className="px-1 text-sm font-semibold text-[#244764]">Player-specific alerts</legend>
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex flex-col gap-1 text-xs text-[#648198]">
                Alert when price reaches or falls below (£m)
                <input
                  type="number"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={watchlistEntry.priceTarget ?? ''}
                  onChange={(input) =>
                    updateAlerts(playerId, {
                      priceTarget: input.target.value ? Number(input.target.value) : null,
                      alertAvailability: watchlistEntry.alertAvailability,
                    })
                  }
                  placeholder="Off"
                  className="w-32 rounded border border-[#c9e0eb] bg-white px-2 py-1.5 text-sm text-[#16324f]"
                />
              </label>
              <label className="flex items-center gap-2 pb-1 text-xs text-[#648198]">
                <input
                  type="checkbox"
                  checked={watchlistEntry.alertAvailability}
                  onChange={(input) =>
                    updateAlerts(playerId, {
                      priceTarget: watchlistEntry.priceTarget,
                      alertAvailability: input.target.checked,
                    })
                  }
                />
                Alert when availability is in doubt
              </label>
            </div>
          </fieldset>
        )}

        {error && <p role="alert" className="my-4 text-sm text-[#b45851]">{error}</p>}
        {!summary && !error && <p className="my-4 text-sm text-[#7891a3]">Loading player history…</p>}

        {summary && (
          <div className="space-y-5">
            {comparablePlayers.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-[#244764]">Similar players · within £1.0m</h3>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {comparablePlayers.map((candidate) => (
                    <li key={candidate.id} className="rounded-lg border border-[#c9e0eb] bg-white p-3">
                      <button
                        type="button"
                        onClick={() => onPlayerSelect(candidate.id)}
                        className="truncate text-left text-sm font-semibold text-[#244764] hover:underline"
                      >
                        {candidate.web_name}
                      </button>
                      <div className="mt-1 text-xs text-[#7891a3]">
                        £{(candidate.now_cost / 10).toFixed(1)}m · {candidate.points_per_game} pts/G · {candidate.form} form
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3 className="mb-2 font-semibold text-[#244764]">Season stats</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {seasonStats.map((stat) => (
                  <div key={stat.key} className="rounded-lg border border-[#c9e0eb] bg-white p-3">
                    <div className="text-xs text-[#7891a3]">{stat.label}</div>
                    <div className="font-bold text-[#244764]">
                      {formatStatValue(stat.value, stat.key.startsWith('expected_'))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-[#244764]">Recent gameweeks</h3>
              <div className="overflow-x-auto rounded-lg border border-[#c9e0eb] bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#e0edf2] text-[#7891a3]">
                    <tr>
                      <th className="p-2">GW</th>
                      {historyStats.map((stat) => (
                        <th key={stat.key} className="p-2" title={stat.label}>{stat.shortLabel}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0edf2] text-[#244764]">
                    {recentHistory.map((week) => (
                      <tr key={week.round}>
                        <td className="p-2">{week.round}</td>
                        {historyStats.map((stat) => {
                          const value = week[stat.key];
                          return (
                            <td key={stat.key} className={`p-2 ${stat.key === 'total_points' ? 'font-bold text-[#327a68]' : ''}`}>
                              {formatStatValue(value, stat.key.startsWith('expected_'))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {recentHistory.length === 0 && <tr><td colSpan={historyStats.length + 1} className="p-3 text-[#7891a3]">No completed gameweek stats yet.</td></tr>}
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
