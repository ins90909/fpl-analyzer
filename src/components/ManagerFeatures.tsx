'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  FPLBootstrap,
  FPLLeagueStandings,
  FPLManagerData,
  FPLManagerLeagues,
  FPLPicksResponse,
} from '@/types/fpl';

interface ManagerFeaturesProps {
  managerId: string;
  eventId: number;
  picks: FPLPicksResponse;
  bootstrap: FPLBootstrap;
}

const chipNames: Record<string, string> = {
  wildcard: 'Wildcard',
  '3xc': 'Triple Captain',
  bboost: 'Bench Boost',
  freehit: 'Free Hit',
  assistant_manager: 'Assistant Manager',
};

export function ManagerFeatures({
  managerId,
  eventId,
  picks,
  bootstrap,
}: ManagerFeaturesProps) {
  const [loadedManager, setLoadedManager] = useState<{
    id: string;
    data: FPLManagerData;
  } | null>(null);
  const [managerError, setManagerError] = useState<{ id: string; message: string } | null>(null);
  const [leagueId, setLeagueId] = useState('');
  const [league, setLeague] = useState<FPLLeagueStandings | null>(null);
  const [leagueError, setLeagueError] = useState<string | null>(null);
  const [leagueLoading, setLeagueLoading] = useState(false);
  const [managerLeagues, setManagerLeagues] = useState<{
    managerId: string;
    data: FPLManagerLeagues;
  } | null>(null);
  const [managerLeaguesError, setManagerLeaguesError] = useState<{
    managerId: string;
    message: string;
  } | null>(null);
  const [selectedManagerLeagueId, setSelectedManagerLeagueId] = useState('');
  const [opponentId, setOpponentId] = useState('');
  const [comparison, setComparison] = useState<{
    managerId: string;
    eventId: number;
    picks: FPLPicksResponse;
    managerData: FPLManagerData;
  } | null>(null);
  const [comparisonError, setComparisonError] = useState<{
    managerId: string;
    eventId: number;
    message: string;
  } | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const playerNames = new Map(bootstrap.elements.map((player) => [player.id, player.web_name]));

  useEffect(() => {
    let active = true;

    fetch(`/api/fpl/manager/${managerId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load transfer and chip history.');
        return response.json() as Promise<FPLManagerData>;
      })
      .then((data) => {
        if (active) setLoadedManager({ id: managerId, data });
      })
      .catch((error: unknown) => {
        if (active) {
          setManagerError({
            id: managerId,
            message: error instanceof Error ? error.message : 'Could not load manager history.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [managerId]);

  useEffect(() => {
    let active = true;

    fetch(`/api/fpl/manager/${managerId}/leagues`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load this manager’s leagues.');
        return response.json() as Promise<FPLManagerLeagues>;
      })
      .then((data) => {
        if (active) setManagerLeagues({ managerId, data });
      })
      .catch((error: unknown) => {
        if (active) {
          setManagerLeaguesError({
            managerId,
            message: error instanceof Error ? error.message : 'Could not load this manager’s leagues.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [managerId]);

  const managerData = loadedManager?.id === managerId ? loadedManager.data : null;
  const visibleManagerError = managerError?.id === managerId ? managerError.message : null;
  const visibleManagerLeagues =
    managerLeagues?.managerId === managerId ? managerLeagues.data : null;
  const visibleManagerLeaguesError =
    managerLeaguesError?.managerId === managerId ? managerLeaguesError.message : null;
  const managerLeaguesLoading =
    !visibleManagerLeagues && !visibleManagerLeaguesError;
  const opponentPicks =
    comparison?.managerId === opponentId.trim() && comparison.eventId === eventId
      ? comparison.picks
      : null;
  const visibleComparisonError =
    comparisonError?.managerId === opponentId.trim() && comparisonError.eventId === eventId
      ? comparisonError.message
      : null;

  const loadLeagueById = async (id: string) => {
    if (!/^\d+$/.test(id.trim())) {
      setLeagueError('Enter a numeric classic league ID.');
      setLeague(null);
      return;
    }

    setLeagueLoading(true);
    setLeagueError(null);
    try {
      const response = await fetch(`/api/fpl/leagues/${id.trim()}`);
      if (!response.ok) throw new Error('Could not load that league. Check that it is a public classic league and the ID is correct.');
      const data = await response.json() as FPLLeagueStandings;
      setLeagueId(id.trim());
      setLeague({
        ...data,
        standings: {
          ...data.standings,
          results: [...data.standings.results].sort((a, b) => a.rank - b.rank),
        },
      });
    } catch (error: unknown) {
      setLeague(null);
      setLeagueError(error instanceof Error ? error.message : 'Could not load league standings.');
    } finally {
      setLeagueLoading(false);
    }
  };

  const loadLeague = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadLeagueById(leagueId);
  };

  const compareManager = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = opponentId.trim();
    if (!/^\d+$/.test(id)) {
      setComparisonError({ managerId: id, eventId, message: 'Enter a numeric manager ID.' });
      return;
    }
    if (id === managerId) {
      setComparisonError({ managerId: id, eventId, message: 'Enter a different manager ID to compare.' });
      return;
    }

    setComparisonLoading(true);
    setComparisonError(null);
    try {
      const [picksResponse, managerResponse] = await Promise.all([
        fetch(`/api/fpl/picks/${id}?event=${eventId}`),
        fetch(`/api/fpl/manager/${id}`),
      ]);
      if (!picksResponse.ok) {
        throw new Error(picksResponse.status === 404
          ? `No picks found for manager ${id} in Gameweek ${eventId}.`
          : 'Could not load that manager.');
      }
      if (!managerResponse.ok) throw new Error('Could not load the other manager’s season history.');
      setComparison({
        managerId: id,
        eventId,
        picks: await picksResponse.json(),
        managerData: await managerResponse.json(),
      });
    } catch (error: unknown) {
      setComparisonError({
        managerId: id,
        eventId,
        message: error instanceof Error ? error.message : 'Could not compare managers.',
      });
    } finally {
      setComparisonLoading(false);
    }
  };

  const ownIds = new Set(picks.picks.map((pick) => pick.element));
  const opponentIds = new Set(opponentPicks?.picks.map((pick) => pick.element) ?? []);
  const sharedPlayers = [...ownIds].filter((id) => opponentIds.has(id)).length;
  const ownCaptain = picks.picks.find((pick) => pick.is_captain);
  const opponentCaptain = opponentPicks?.picks.find((pick) => pick.is_captain);
  const ownHistory = managerData?.history.current.find((week) => week.event === eventId);
  const opponentManagerData = opponentPicks ? comparison?.managerData : null;
  const opponentHistory = opponentManagerData?.history.current.find((week) => week.event === eventId);
  const ownOnlyPlayers = picks.picks.filter((pick) => !opponentIds.has(pick.element));
  const opponentOnlyPlayers = opponentPicks?.picks.filter((pick) => !ownIds.has(pick.element)) ?? [];
  const ownEventTransfers = managerData?.transfers.filter((transfer) => transfer.event === eventId) ?? null;
  const opponentEventTransfers = opponentManagerData?.transfers.filter((transfer) => transfer.event === eventId) ?? null;
  const ownEventChips = managerData?.history.chips.filter((chip) => chip.event === eventId) ?? null;
  const opponentEventChips = opponentManagerData?.history.chips.filter((chip) => chip.event === eventId) ?? null;
  const ownTransferCount = ownHistory?.event_transfers ?? ownEventTransfers?.length ?? null;
  const opponentTransferCount = opponentHistory?.event_transfers ?? opponentEventTransfers?.length ?? null;
  const chipsMatch = ownEventChips && opponentEventChips
    ? [...ownEventChips.map((chip) => chip.name)].sort().join(',') ===
      [...opponentEventChips.map((chip) => chip.name)].sort().join(',')
    : null;
  const captainDiffers = ownCaptain && opponentCaptain
    ? ownCaptain.element !== opponentCaptain.element
    : null;
  const rankHistory = managerData?.history.current.filter((week) => week.overall_rank > 0) ?? [];
  const chartWidth = 640;
  const chartHeight = 180;
  const chartPadding = 28;
  const minRank = rankHistory.length ? Math.min(...rankHistory.map((week) => week.overall_rank)) : 1;
  const maxRank = rankHistory.length ? Math.max(...rankHistory.map((week) => week.overall_rank)) : 1;
  const rankRange = Math.max(1, Math.log10(maxRank) - Math.log10(minRank));
  const rankPoints = rankHistory.map((week, index) => ({
    ...week,
    x: rankHistory.length === 1
      ? chartWidth / 2
      : chartPadding + index * (chartWidth - 2 * chartPadding) / (rankHistory.length - 1),
    y: chartPadding +
      (Math.log10(week.overall_rank) - Math.log10(minRank)) / rankRange *
      (chartHeight - 2 * chartPadding),
  }));
  const rankPath = rankPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const comparisonWeeks = opponentManagerData && managerData
    ? managerData.history.current
        .filter((week) => week.overall_rank > 0)
        .map((week) => ({
          own: week,
          opponent: opponentManagerData.history.current.find(
            (otherWeek) => otherWeek.event === week.event && otherWeek.overall_rank > 0
          ),
        }))
        .filter((week) => week.opponent !== undefined)
    : [];
  const comparedRanks = comparisonWeeks.flatMap((week) => [
    week.own.overall_rank,
    week.opponent!.overall_rank,
  ]);
  const comparisonMinRank = comparedRanks.length ? Math.min(...comparedRanks) : 1;
  const comparisonMaxRank = comparedRanks.length ? Math.max(...comparedRanks) : 1;
  const comparisonRankRange = Math.max(1, Math.log10(comparisonMaxRank) - Math.log10(comparisonMinRank));
  const comparisonPath = (manager: 'own' | 'opponent') => comparisonWeeks
    .map((week, index) => {
      const rank = week[manager]!.overall_rank;
      const x = comparisonWeeks.length === 1
        ? chartWidth / 2
        : chartPadding + index * (chartWidth - 2 * chartPadding) / (comparisonWeeks.length - 1);
      const y = chartPadding +
        (Math.log10(rank) - Math.log10(comparisonMinRank)) / comparisonRankRange *
        (chartHeight - 2 * chartPadding);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="space-y-6" aria-label="Manager tools">
      <h2 className="text-lg font-bold text-[#244764]">Manager tools</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="p-5 bg-white border border-[#c9e0eb] rounded-lg space-y-4">
          <h3 className="font-bold text-[#244764]">Transfers &amp; chips</h3>
          {visibleManagerError && <p role="alert" className="text-sm text-[#b45851]">{visibleManagerError}</p>}
          {!managerData && !visibleManagerError && <p className="text-sm text-[#7891a3]">Loading manager history…</p>}
          {managerData && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-[#327a68] mb-2">Chips played</h4>
                {managerData.history.chips.length ? (
                  <ul className="space-y-2">
                    {managerData.history.chips.map((chip, index) => (
                      <li key={`${chip.name}-${chip.event}-${index}`} className="flex justify-between text-sm">
                        <span className="text-[#244764]">{chipNames[chip.name] ?? chip.name}</span>
                        <span className="text-[#7891a3]">GW{chip.event}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#7891a3]">No chips played this season.</p>
                )}
              </div>
                {rankHistory.length > 1 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#327a68] mb-2">Global rank by gameweek</h4>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Season global rank history chart" className="w-full rounded-lg bg-[#f4fbff]">
                      <title>Global rank (lower is better)</title>
                      <line x1={chartPadding} y1={chartPadding} x2={chartPadding} y2={chartHeight - chartPadding} stroke="#c9e0eb" />
                      <line x1={chartPadding} y1={chartHeight - chartPadding} x2={chartWidth - chartPadding} y2={chartHeight - chartPadding} stroke="#c9e0eb" />
                      <polyline points={rankPath} fill="none" stroke="#327a68" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                      {rankPoints.map((point) => (
                        <circle key={point.event} cx={point.x} cy={point.y} r="4" fill="#55b89a">
                          <title>GW{point.event}: rank {point.overall_rank.toLocaleString()}</title>
                        </circle>
                      ))}
                      <text x={chartPadding} y={chartHeight - 7} fontSize="11" fill="#648198">GW{rankHistory[0].event}</text>
                      <text x={chartWidth - chartPadding} y={chartHeight - 7} textAnchor="end" fontSize="11" fill="#648198">GW{rankHistory[rankHistory.length - 1].event}</text>
                      <text x={chartPadding + 5} y={chartPadding + 10} fontSize="10" fill="#648198">{minRank.toLocaleString()}</text>
                      <text x={chartPadding + 5} y={chartHeight - chartPadding - 5} fontSize="10" fill="#648198">{maxRank.toLocaleString()}</text>
                    </svg>
                    <p className="mt-1 text-[10px] text-[#7891a3]">Logarithmic scale · lower rank is better</p>
                  </div>
                )}
                <div>
                <h4 className="text-sm font-semibold text-[#327a68] mb-2">Recent transfers</h4>
                {managerData.transfers.length ? (
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#e0edf2]">
                    {[...managerData.transfers].reverse().slice(0, 20).map((transfer, index) => (
                      <div key={`${transfer.event}-${transfer.time}-${index}`} className="py-2 text-xs">
                        <div className="flex justify-between gap-3">
                          <span className="font-semibold text-[#244764]">Gameweek {transfer.event}</span>
                          <span className="text-[#7891a3]">{new Date(transfer.time).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-1 text-[#7891a3]">
                          <span className="text-[#b45851]">{playerNames.get(transfer.element_out) ?? `Player ${transfer.element_out}`}</span>
                          {' → '}
                          <span className="text-[#327a68]">{playerNames.get(transfer.element_in) ?? `Player ${transfer.element_in}`}</span>
                          {' · '}£{(transfer.element_out_cost / 10).toFixed(1)}m → £{(transfer.element_in_cost / 10).toFixed(1)}m
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#7891a3]">No transfers recorded this season.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-5 bg-white border border-[#c9e0eb] rounded-lg space-y-4">
          <h3 className="font-bold text-[#244764]">Manager comparison · Gameweek {eventId}</h3>
          <form onSubmit={compareManager} className="flex gap-2">
            <label className="sr-only" htmlFor="compare-manager-id">Other manager ID</label>
            <input
              id="compare-manager-id"
              inputMode="numeric"
              value={opponentId}
              onChange={(event) => setOpponentId(event.target.value)}
              placeholder="Enter another manager ID"
              className="min-w-0 flex-1 rounded-lg border border-[#c9e0eb] bg-white px-3 py-2 text-sm text-[#16324f]"
            />
            <button type="submit" disabled={comparisonLoading} className="rounded-lg bg-[#55b89a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {comparisonLoading ? 'Comparing…' : 'Compare'}
            </button>
          </form>
          {visibleComparisonError && <p role="alert" className="text-sm text-[#b45851]">{visibleComparisonError}</p>}
          {opponentPicks && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#eaf6fb] p-3">
                  <div className="text-xs text-[#7891a3]">Manager {managerId}</div>
                  <div className="text-xs text-[#7891a3]">GW {picks.entry_history.points} pts</div>
                  <div className="text-lg font-bold text-[#244764]">{picks.entry_history.total_points.toLocaleString()} season pts</div>
                  <div className="text-xs text-[#7891a3]">Global rank {ownHistory?.overall_rank.toLocaleString() ?? picks.entry_history.overall_rank.toLocaleString()}</div>
                  <div className="text-xs text-[#7891a3]">GW rank {ownHistory?.rank.toLocaleString() ?? '—'}</div>
                  <div className="text-xs text-[#7891a3]">Team value £{(picks.entry_history.value / 10).toFixed(1)}m</div>
                  <div className="text-xs text-[#7891a3]">Transfers {ownHistory?.event_transfers ?? '—'} · hit cost {ownHistory?.event_transfers_cost ?? '—'} pts</div>
                </div>
                <div className="rounded-lg bg-[#eaf6fb] p-3">
                  <div className="text-xs text-[#7891a3]">Manager {opponentId}</div>
                  <div className="text-xs text-[#7891a3]">GW {opponentPicks.entry_history.points} pts</div>
                  <div className="text-lg font-bold text-[#244764]">{opponentPicks.entry_history.total_points.toLocaleString()} season pts</div>
                  <div className="text-xs text-[#7891a3]">Global rank {opponentHistory?.overall_rank.toLocaleString() ?? opponentPicks.entry_history.overall_rank.toLocaleString()}</div>
                  <div className="text-xs text-[#7891a3]">GW rank {opponentHistory?.rank.toLocaleString() ?? '—'}</div>
                  <div className="text-xs text-[#7891a3]">Team value £{(opponentPicks.entry_history.value / 10).toFixed(1)}m</div>
                  <div className="text-xs text-[#7891a3]">Transfers {opponentHistory?.event_transfers ?? '—'} · hit cost {opponentHistory?.event_transfers_cost ?? '—'} pts</div>
                </div>
              </div>
              <p className="text-sm text-[#648198]">
                {sharedPlayers} of 15 players shared
                {' · '}Captains: {playerNames.get(ownCaptain?.element ?? -1) ?? '—'}
                {' vs '}{playerNames.get(opponentCaptain?.element ?? -1) ?? '—'}
              </p>
              <div className="rounded-lg border border-[#c9e0eb] bg-[#f4fbff] p-3">
                <h4 className="mb-3 text-sm font-semibold text-[#327a68]">Gameweek differences</h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h5 className="text-xs font-semibold text-[#244764]">Squad</h5>
                      <span className="text-xs text-[#648198]">{sharedPlayers} shared · {ownOnlyPlayers.length + opponentOnlyPlayers.length} different</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="mb-1 text-[#7891a3]">Only manager {managerId}</div>
                        {ownOnlyPlayers.length ? ownOnlyPlayers.map((pick) => (
                          <div key={pick.element} className="text-[#b45851]">{playerNames.get(pick.element) ?? `Player ${pick.element}`}</div>
                        )) : <div className="text-[#7891a3]">None</div>}
                      </div>
                      <div>
                        <div className="mb-1 text-[#7891a3]">Only manager {opponentId}</div>
                        {opponentOnlyPlayers.length ? opponentOnlyPlayers.map((pick) => (
                          <div key={pick.element} className="text-[#327a68]">{playerNames.get(pick.element) ?? `Player ${pick.element}`}</div>
                        )) : <div className="text-[#7891a3]">None</div>}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h5 className="text-xs font-semibold text-[#244764]">Captain picks</h5>
                      {captainDiffers === null ? (
                        <span className="text-xs text-[#7891a3]">Unavailable</span>
                      ) : (
                        <span className={`text-xs font-semibold ${captainDiffers ? 'text-[#b45851]' : 'text-[#327a68]'}`}>
                          {captainDiffers ? 'Different' : 'Same pick'}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="mb-1 text-[#7891a3]">Manager {managerId}</div>
                        <div className="font-medium text-[#244764]">{playerNames.get(ownCaptain?.element ?? -1) ?? 'Unavailable'}</div>
                      </div>
                      <div>
                        <div className="mb-1 text-[#7891a3]">Manager {opponentId}</div>
                        <div className="font-medium text-[#244764]">{playerNames.get(opponentCaptain?.element ?? -1) ?? 'Unavailable'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h5 className="text-xs font-semibold text-[#244764]">Transfers · GW{eventId}</h5>
                      {ownTransferCount !== null && opponentTransferCount !== null && (
                        <span className={`text-xs font-semibold ${ownTransferCount === opponentTransferCount ? 'text-[#327a68]' : 'text-[#b45851]'}`}>
                          {ownTransferCount === opponentTransferCount ? 'Same count' : 'Different counts'}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                      {[
                        { id: managerId, count: ownTransferCount, transfers: ownEventTransfers, unavailable: !managerData },
                        { id: opponentId, count: opponentTransferCount, transfers: opponentEventTransfers, unavailable: !opponentManagerData },
                      ].map((manager) => (
                        <div key={manager.id}>
                          <div className="mb-1 text-[#7891a3]">Manager {manager.id}{manager.count !== null ? ` · ${manager.count}` : ''}</div>
                          {manager.unavailable ? (
                            <div className="text-[#7891a3]">{visibleManagerError ? 'History unavailable' : 'Loading history…'}</div>
                          ) : manager.transfers?.length ? (
                            manager.transfers.map((transfer, index) => (
                              <div key={`${transfer.element_out}-${transfer.element_in}-${index}`} className="text-[#648198]">
                                <span className="text-[#b45851]">{playerNames.get(transfer.element_out) ?? `Player ${transfer.element_out}`}</span>
                                {' → '}
                                <span className="text-[#327a68]">{playerNames.get(transfer.element_in) ?? `Player ${transfer.element_in}`}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[#7891a3]">{manager.count ? 'Transfer details unavailable' : 'No transfers'}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h5 className="text-xs font-semibold text-[#244764]">Chips · GW{eventId}</h5>
                      {chipsMatch !== null && (
                        <span className={`text-xs font-semibold ${chipsMatch ? 'text-[#327a68]' : 'text-[#b45851]'}`}>
                          {chipsMatch ? 'Same' : 'Different'}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                      {[
                        { id: managerId, chips: ownEventChips, unavailable: !managerData },
                        { id: opponentId, chips: opponentEventChips, unavailable: !opponentManagerData },
                      ].map((manager) => (
                        <div key={manager.id}>
                          <div className="mb-1 text-[#7891a3]">Manager {manager.id}</div>
                          {manager.unavailable ? (
                            <div className="text-[#7891a3]">{visibleManagerError ? 'History unavailable' : 'Loading history…'}</div>
                          ) : manager.chips?.length ? (
                            <div className="font-medium text-[#244764]">
                              {manager.chips.map((chip) => chipNames[chip.name] ?? chip.name).join(', ')}
                            </div>
                          ) : (
                            <div className="text-[#7891a3]">No chip</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {comparisonWeeks.length > 1 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-[#327a68]">Season global rank comparison</h4>
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Season rank comparison chart" className="w-full rounded-lg bg-[#f4fbff]">
                    <title>Global rank comparison (lower is better)</title>
                    <polyline points={comparisonPath('own')} fill="none" stroke="#327a68" strokeWidth="3" strokeLinejoin="round" />
                    <polyline points={comparisonPath('opponent')} fill="none" stroke="#397b98" strokeWidth="3" strokeLinejoin="round" />
                    <text x={chartPadding} y={chartHeight - 7} fontSize="11" fill="#648198">GW{comparisonWeeks[0].own.event}</text>
                    <text x={chartWidth - chartPadding} y={chartHeight - 7} textAnchor="end" fontSize="11" fill="#648198">GW{comparisonWeeks[comparisonWeeks.length - 1].own.event}</text>
                  </svg>
                  <div className="mt-2 flex gap-4 text-xs text-[#648198]">
                    <span><span className="text-[#327a68]">●</span> Manager {managerId}</span>
                    <span><span className="text-[#397b98]">●</span> Manager {opponentId}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 bg-white border border-[#c9e0eb] rounded-lg space-y-4 xl:col-span-2">
          <h3 className="font-bold text-[#244764]">Mini-league standings</h3>
          <div className="space-y-2">
            <label htmlFor="manager-classic-leagues" className="block text-sm font-semibold text-[#244764]">
              Your classic leagues
            </label>
            {managerLeaguesLoading && (
              <p className="text-sm text-[#7891a3]">Loading your leagues…</p>
            )}
            {visibleManagerLeaguesError && (
              <p role="alert" className="text-sm text-[#b45851]">
                {visibleManagerLeaguesError} You can still load standings with a league ID below.
              </p>
            )}
            {visibleManagerLeagues && visibleManagerLeagues.classic.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <select
                  id="manager-classic-leagues"
                  value={selectedManagerLeagueId}
                  onChange={(event) => setSelectedManagerLeagueId(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-[#c9e0eb] bg-white px-3 py-2 text-sm text-[#16324f]"
                >
                  <option value="">Choose a classic league</option>
                  {visibleManagerLeagues.classic.map((managerLeague) => (
                    <option key={managerLeague.id} value={managerLeague.id}>
                      {managerLeague.name} · ID {managerLeague.id}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedManagerLeagueId || leagueLoading}
                  onClick={() => void loadLeagueById(selectedManagerLeagueId)}
                  className="rounded-lg bg-[#55b89a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {leagueLoading && selectedManagerLeagueId === leagueId ? 'Loading…' : 'Show standings'}
                </button>
              </div>
            )}
            {visibleManagerLeagues && visibleManagerLeagues.classic.length === 0 && (
              <p className="text-sm text-[#7891a3]">
                No classic leagues found for this manager. You can still enter a league ID below.
              </p>
            )}
          </div>
          <div className="border-t border-[#e0edf2] pt-3">
            <h4 className="mb-2 text-sm font-semibold text-[#244764]">Or enter a league ID</h4>
          <form onSubmit={loadLeague} className="flex gap-2">
            <label className="sr-only" htmlFor="classic-league-id">Classic league ID</label>
            <input
              id="classic-league-id"
              inputMode="numeric"
              value={leagueId}
              onChange={(event) => setLeagueId(event.target.value)}
              placeholder="Enter a classic league ID"
              className="min-w-0 flex-1 rounded-lg border border-[#c9e0eb] bg-white px-3 py-2 text-sm text-[#16324f]"
            />
            <button type="submit" disabled={leagueLoading} className="rounded-lg bg-[#55b89a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {leagueLoading ? 'Loading…' : 'Show standings'}
            </button>
          </form>
          </div>
          {leagueError && <p role="alert" className="text-sm text-[#b45851]">{leagueError}</p>}
          {league && (
            <div className="overflow-x-auto">
              <h4 className="font-semibold text-[#327a68] mb-2">{league.league.name}</h4>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#e0edf2] text-xs text-[#7891a3]">
                  <tr>
                    <th className="py-2 pr-3">Rank</th>
                    <th className="py-2 pr-3">Movement</th>
                    <th className="py-2 pr-3">Manager</th>
                    <th className="py-2 pr-3">Team</th>
                    <th className="py-2 pr-3">GW points</th>
                    <th className="py-2">Total</th>
                    <th className="py-2 pl-3">To overtake</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0edf2]">
                  {league.standings.results.map((standing, index, results) => {
                    const movement = standing.last_rank > 0 ? standing.last_rank - standing.rank : null;
                    const managerAhead = results[index - 1];
                    const pointsToOvertake = managerAhead
                      ? Math.max(0, managerAhead.total - standing.total + 1)
                      : null;

                    return (
                      <tr key={standing.entry} className={standing.entry.toString() === managerId ? 'bg-[#e8f7f0]' : ''}>
                        <td className="py-2 pr-3 text-[#648198]">{standing.rank}</td>
                        <td className="py-2 pr-3">
                          {movement === null ? (
                            <span className="text-[#7891a3]" aria-label="Rank movement unavailable">—</span>
                          ) : movement > 0 ? (
                            <span className="font-semibold text-[#327a68]" aria-label={`Moved up ${movement} places`}>↑ {movement}</span>
                          ) : movement < 0 ? (
                            <span className="font-semibold text-[#b45851]" aria-label={`Moved down ${Math.abs(movement)} places`}>↓ {Math.abs(movement)}</span>
                          ) : (
                            <span className="text-[#7891a3]" aria-label="No rank change">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-[#244764]">{standing.player_name}</td>
                        <td className="py-2 pr-3 text-[#648198]">{standing.entry_name}</td>
                        <td className="py-2 pr-3 text-[#327a68]">{standing.event_total}</td>
                        <td className="py-2 font-semibold text-[#244764]">{standing.total.toLocaleString()}</td>
                        <td className="py-2 pl-3 text-[#648198]">
                          {pointsToOvertake === null ? '—' : `${pointsToOvertake.toLocaleString()} pts`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-[#7891a3]">Movement is since the previous league update. “To overtake” shows the points needed to pass the manager directly above on this page.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
