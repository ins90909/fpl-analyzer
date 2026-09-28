'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  FPLBootstrap,
  FPLLeagueStandings,
  FPLManagerData,
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
  const [opponentId, setOpponentId] = useState('');
  const [comparison, setComparison] = useState<{
    managerId: string;
    eventId: number;
    picks: FPLPicksResponse;
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

  const managerData = loadedManager?.id === managerId ? loadedManager.data : null;
  const visibleManagerError = managerError?.id === managerId ? managerError.message : null;
  const opponentPicks =
    comparison?.managerId === opponentId.trim() && comparison.eventId === eventId
      ? comparison.picks
      : null;
  const visibleComparisonError =
    comparisonError?.managerId === opponentId.trim() && comparisonError.eventId === eventId
      ? comparisonError.message
      : null;

  const loadLeague = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d+$/.test(leagueId.trim())) {
      setLeagueError('Enter a numeric classic league ID.');
      setLeague(null);
      return;
    }

    setLeagueLoading(true);
    setLeagueError(null);
    try {
      const response = await fetch(`/api/fpl/leagues/${leagueId.trim()}`);
      if (!response.ok) throw new Error('Could not load that league. Check that it is a public classic league and the ID is correct.');
      const data = await response.json() as FPLLeagueStandings;
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
      const response = await fetch(`/api/fpl/picks/${id}?event=${eventId}`);
      if (!response.ok) {
        throw new Error(response.status === 404
          ? `No picks found for manager ${id} in Gameweek ${eventId}.`
          : 'Could not load that manager.');
      }
      setComparison({
        managerId: id,
        eventId,
        picks: await response.json(),
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
                  <div className="text-xl font-bold text-[#244764]">{picks.entry_history.points} pts</div>
                  <div className="text-xs text-[#7891a3]">Rank {picks.entry_history.overall_rank.toLocaleString()}</div>
                </div>
                <div className="rounded-lg bg-[#eaf6fb] p-3">
                  <div className="text-xs text-[#7891a3]">Manager {opponentId}</div>
                  <div className="text-xl font-bold text-[#244764]">{opponentPicks.entry_history.points} pts</div>
                  <div className="text-xs text-[#7891a3]">Rank {opponentPicks.entry_history.overall_rank.toLocaleString()}</div>
                </div>
              </div>
              <p className="text-sm text-[#648198]">
                {sharedPlayers} of 15 players shared
                {' · '}Captains: {playerNames.get(ownCaptain?.element ?? -1) ?? '—'}
                {' vs '}{playerNames.get(opponentCaptain?.element ?? -1) ?? '—'}
              </p>
            </div>
          )}
        </div>

        <div className="p-5 bg-white border border-[#c9e0eb] rounded-lg space-y-4 xl:col-span-2">
          <h3 className="font-bold text-[#244764]">Mini-league standings</h3>
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
          {leagueError && <p role="alert" className="text-sm text-[#b45851]">{leagueError}</p>}
          {league && (
            <div className="overflow-x-auto">
              <h4 className="font-semibold text-[#327a68] mb-2">{league.league.name}</h4>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#e0edf2] text-xs text-[#7891a3]">
                  <tr>
                    <th className="py-2 pr-3">Rank</th>
                    <th className="py-2 pr-3">Manager</th>
                    <th className="py-2 pr-3">Team</th>
                    <th className="py-2 pr-3">GW points</th>
                    <th className="py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0edf2]">
                  {league.standings.results.map((standing) => (
                    <tr key={standing.entry} className={standing.entry.toString() === managerId ? 'bg-[#e8f7f0]' : ''}>
                      <td className="py-2 pr-3 text-[#648198]">{standing.rank}</td>
                      <td className="py-2 pr-3 text-[#244764]">{standing.player_name}</td>
                      <td className="py-2 pr-3 text-[#648198]">{standing.entry_name}</td>
                      <td className="py-2 pr-3 text-[#327a68]">{standing.event_total}</td>
                      <td className="py-2 font-semibold text-[#244764]">{standing.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-[#7891a3]">Showing this page of league standings.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
