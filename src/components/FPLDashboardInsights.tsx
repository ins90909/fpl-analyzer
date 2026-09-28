'use client';

import { useEffect, useState } from 'react';
import { FPLBootstrap, FPLEvent, FPLLiveResponse } from '@/types/fpl';
import { useWatchlist } from './WatchlistProvider';

interface FPLDashboardInsightsProps {
  bootstrap: FPLBootstrap;
  event: FPLEvent;
  liveData: FPLLiveResponse;
  onPlayerSelect: (playerId: number) => void;
}

const positionNames: Record<number, string> = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

function formatCountdown(milliseconds: number) {
  if (milliseconds <= 0) return 'Deadline passed';
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
}

function getTopScoringXI(bootstrap: FPLBootstrap, liveData: FPLLiveResponse) {
  const scoreById = new Map(
    liveData.elements.map((element) => [element.id, element.stats.total_points])
  );
  const candidates = [...bootstrap.elements]
    .filter((player) => player.element_type >= 1 && player.element_type <= 4)
    .sort((a, b) => (scoreById.get(b.id) ?? 0) - (scoreById.get(a.id) ?? 0));
  const selected: typeof bootstrap.elements = [];
  const counts = [0, 0, 0, 0, 0];
  const clubs = new Map<number, number>();
  const minimums = [0, 1, 3, 2, 1];
  const maximums = [0, 1, 5, 5, 3];

  for (const player of candidates) {
    const position = player.element_type;
    if (counts[position] >= maximums[position] || (clubs.get(player.team) ?? 0) >= 3) continue;

    const nextCounts = [...counts];
    nextCounts[position] += 1;
    const remainingSlots = 10 - selected.length;
    const minimumPlayersNeeded = [1, 2, 3, 4].reduce(
      (sum, type) => sum + Math.max(0, minimums[type] - nextCounts[type]),
      0
    );
    if (minimumPlayersNeeded > remainingSlots) continue;

    selected.push(player);
    counts[position] += 1;
    clubs.set(player.team, (clubs.get(player.team) ?? 0) + 1);
    if (selected.length === 11) break;
  }

  return selected;
}

export function FPLDashboardInsights({
  bootstrap,
  event,
  liveData,
  onPlayerSelect,
}: FPLDashboardInsightsProps) {
  const { entries, togglePlayer } = useWatchlist();
  const [now, setNow] = useState(0);
  const [priceFilter, setPriceFilter] = useState<'all' | 'risers' | 'fallers'>('all');
  const [priceSearch, setPriceSearch] = useState('');
  const priceChanges = bootstrap.elements
    .filter((player) => {
      const change = player.cost_change_event ?? 0;
      if (priceFilter === 'risers' && change <= 0) return false;
      if (priceFilter === 'fallers' && change >= 0) return false;

      const query = priceSearch.trim().toLocaleLowerCase();
      if (!query) return change !== 0;
      const team = bootstrap.teams.find((item) => item.id === player.team);
      return (
        change !== 0 &&
        (player.web_name.toLocaleLowerCase().includes(query) ||
          `${player.first_name} ${player.second_name}`.toLocaleLowerCase().includes(query) ||
          team?.name.toLocaleLowerCase().includes(query) === true ||
          team?.short_name.toLocaleLowerCase().includes(query) === true)
      );
    })
    .sort((a, b) => {
      const movementDifference =
        Math.abs(b.cost_change_event ?? 0) - Math.abs(a.cost_change_event ?? 0);
      return movementDifference || a.web_name.localeCompare(b.web_name);
    });
  const seasonPriceChanges = bootstrap.elements
    .filter((player) => (player.cost_change_start ?? 0) !== 0)
    .sort((a, b) => Math.abs(b.cost_change_start ?? 0) - Math.abs(a.cost_change_start ?? 0))
    .slice(0, 6);
  const watchlist = entries
    .map((entry) => ({
      entry,
      player: bootstrap.elements.find((player) => player.id === entry.playerId),
    }))
    .filter((item) => item.player !== undefined);
  const nextEvent = [...bootstrap.events]
    .filter((item) => !item.finished && item.deadline_time && new Date(item.deadline_time).getTime() > now)
    .sort((a, b) => new Date(a.deadline_time!).getTime() - new Date(b.deadline_time!).getTime())[0];
  const deadline = nextEvent ?? event;
  const topXI = getTopScoringXI(bootstrap, liveData);
  const pointsById = new Map(liveData.elements.map((player) => [player.id, player.stats.total_points]));
  const topCaptain = [...topXI].sort(
    (a, b) => (pointsById.get(b.id) ?? 0) - (pointsById.get(a.id) ?? 0)
  )[0];

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="space-y-6" aria-label="Gameweek insights">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="space-y-5">
          <div className="self-start p-5 bg-white border border-[#c9e0eb] rounded-lg space-y-3">
            <h2 className="font-bold text-[#244764]">Next deadline</h2>
            {deadline?.deadline_time ? (
              <>
                <p className="text-2xl font-extrabold text-[#327a68]">
                  {formatCountdown(new Date(deadline.deadline_time).getTime() - now)}
                </p>
                <p className="text-sm text-[#648198]">
                  {deadline.name} · {new Date(deadline.deadline_time).toLocaleString()}
                </p>
              </>
            ) : <p className="text-sm text-[#7891a3]">No upcoming deadline available.</p>}
          </div>
          <section className="p-5 bg-white border border-[#c9e0eb] rounded-lg space-y-3" aria-label="Season price changes">
            <h2 className="font-bold text-[#244764]">Largest net price moves this season</h2>
            {seasonPriceChanges.length ? (
              <ul className="max-h-40 space-y-2 overflow-y-auto pr-2">
                {seasonPriceChanges.map((player) => (
                  <li key={player.id} className="flex justify-between gap-2 rounded-lg bg-[#f4fbff] p-2 text-xs">
                    <button type="button" onClick={() => onPlayerSelect(player.id)} className="min-w-0 truncate text-left font-semibold text-[#244764] hover:underline">
                      {player.web_name}
                    </button>
                    <span className="shrink-0 text-[#648198]">
                      £{((player.now_cost - player.cost_change_start!) / 10).toFixed(1)}m
                      <span className="mx-2 text-[#7891a3]">→</span>
                      <span className={player.cost_change_start! > 0 ? 'font-semibold text-[#327a68]' : 'font-semibold text-[#b45851]'}>
                        £{(player.now_cost / 10).toFixed(1)}m
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-[#7891a3]">No net player price changes this season.</p>}
          </section>
        </div>

        <section
          className="p-5 bg-white border border-[#c9e0eb] rounded-lg space-y-3 xl:col-span-2"
          aria-label="Confirmed price changes"
        >
          <div>
            <h2 className="font-bold text-[#244764]">Confirmed price changes</h2>
            <p className="text-xs text-[#7891a3]">Players whose prices have already changed this gameweek</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="price-change-search">Search changed players or teams</label>
            <input
              id="price-change-search"
              type="search"
              value={priceSearch}
              onChange={(input) => setPriceSearch(input.target.value)}
              placeholder="Search player or team"
              className="min-w-0 flex-1 rounded-lg border border-[#c9e0eb] bg-white px-3 py-2 text-sm text-[#16324f] placeholder:text-[#8aa4b5] focus:outline-none focus:border-[#55b89a]"
            />
            <div className="flex gap-2" role="group" aria-label="Filter confirmed price changes">
              {([
                ['all', 'All'],
                ['risers', 'Risers'],
                ['fallers', 'Fallers'],
              ] as const).map(([filter, label]) => (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={priceFilter === filter}
                  onClick={() => setPriceFilter(filter)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    priceFilter === filter
                      ? 'border-[#327a68] bg-[#e8f7f0] text-[#327a68]'
                      : 'border-[#c9e0eb] bg-white text-[#648198] hover:bg-[#eff9f5]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-[#7891a3]" aria-live="polite">
            {priceChanges.length} {priceChanges.length === 1 ? 'player' : 'players'} · sorted by largest price move
          </p>
          {priceChanges.length ? (
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-2">
              {priceChanges.map((player) => (
                <li key={player.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#f4fbff] p-2 text-sm">
                  <button type="button" onClick={() => onPlayerSelect(player.id)} className="min-w-0 truncate text-left font-semibold text-[#244764] hover:underline">
                    {player.web_name}
                    <span className="ml-2 text-xs font-normal text-[#7891a3]">
                      {bootstrap.teams.find((item) => item.id === player.team)?.short_name}
                    </span>
                  </button>
                  <span className="shrink-0 text-xs text-[#648198]">
                    £{((player.now_cost - player.cost_change_event!) / 10).toFixed(1)}m
                    <span className="mx-2 text-[#7891a3]">→</span>
                    <span className={player.cost_change_event! > 0 ? 'font-semibold text-[#327a68]' : 'font-semibold text-[#b45851]'}>
                      £{(player.now_cost / 10).toFixed(1)}m
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#7891a3]">
              {priceSearch.trim() || priceFilter !== 'all'
                ? 'No confirmed price changes match your search and filter.'
                : 'No confirmed price changes are recorded by FPL right now.'}
            </p>
          )}
        </section>

        <div className="p-5 bg-[#eaf6fb] border border-[#c9e0eb] rounded-lg space-y-3 xl:col-span-3">
          <div>
            <h2 className="font-bold text-[#244764]">Team of the week · {event.name}</h2>
            <p className="text-xs text-[#648198]">Best legal XI calculated from current gameweek player points. Captain is the highest scorer.</p>
          </div>
          {topXI.length === 11 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {topXI.map((player) => (
                  <div key={player.id} className="rounded-lg border border-[#c9e0eb] bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-[#327a68]">{positionNames[player.element_type]}</span>
                      {player.id === topCaptain?.id && <span className="text-[10px] font-black text-[#8a671c]">(C)</span>}
                    </div>
                    <button type="button" onClick={() => onPlayerSelect(player.id)} className="mt-1 block w-full truncate text-left text-sm font-semibold text-[#244764] hover:underline">
                      {player.web_name}
                    </button>
                    <div className="text-xs text-[#7891a3]">{bootstrap.teams.find((team) => team.id === player.team)?.short_name}</div>
                    <div className="mt-1 font-bold text-[#327a68]">{pointsById.get(player.id) ?? 0} pts</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#648198]">
                XI points: {topXI.reduce((total, player) => total + (pointsById.get(player.id) ?? 0), 0) + (pointsById.get(topCaptain?.id ?? 0) ?? 0)}
              </p>
            </>
          ) : <p className="text-sm text-[#7891a3]">Not enough player data to calculate the XI.</p>}
        </div>

        <div className="p-5 bg-white border border-[#c9e0eb] rounded-lg space-y-4 xl:col-span-3">
          <div>
            <h2 className="font-bold text-[#244764]">Watchlist &amp; alerts</h2>
            <p className="text-xs text-[#648198]">Saved in this browser. Price movement, injury status and news are refreshed from FPL data.</p>
          </div>
          {watchlist.length ? (
            <ul className="divide-y divide-[#e0edf2]">
              {watchlist.map(({ player, entry }) => {
                if (!player) return null;
                const statusAlert = player.status !== 'a' || (player.chance_of_playing_next_round !== null && player.chance_of_playing_next_round < 100);
                const priceChange = player.cost_change_event ?? 0;
                const targetReached = entry.priceTarget !== null && player.now_cost / 10 <= entry.priceTarget;
                const availabilityAlert = entry.alertAvailability && statusAlert;
                return (
                  <li key={player.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <button type="button" onClick={() => onPlayerSelect(player.id)} className="font-semibold text-[#244764] hover:underline">
                        {player.web_name}
                      </button>
                      <span className="ml-2 text-xs text-[#7891a3]">£{(player.now_cost / 10).toFixed(1)}m · Form {player.form}</span>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        {priceChange !== 0 && <span className={priceChange > 0 ? 'text-[#327a68]' : 'text-[#b45851]'}>Price {priceChange > 0 ? 'rose' : 'fell'} £{(Math.abs(priceChange) / 10).toFixed(1)}m</span>}
                        {entry.priceTarget !== null && (
                          <span className={targetReached ? 'font-semibold text-[#327a68]' : 'text-[#648198]'}>
                            {targetReached ? 'Price target reached' : `Target £${entry.priceTarget.toFixed(1)}m`}
                          </span>
                        )}
                        {statusAlert ? (
                          <span className={availabilityAlert ? 'text-[#b45851]' : 'text-[#8a671c]'}>
                            {player.news || (player.chance_of_playing_next_round !== null ? `${player.chance_of_playing_next_round}% chance of playing` : 'Unavailable')}
                            {availabilityAlert ? ' · alert' : ' · alert muted'}
                          </span>
                        ) : (
                          <span className="text-[#327a68]">Available</span>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => togglePlayer(player.id)} className="rounded-lg border border-[#c9e0eb] px-3 py-1.5 text-xs font-semibold text-[#648198] hover:bg-[#eff9f5]">
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-[#7891a3]">Your watchlist is empty. Add players from their detail panel.</p>
          )}
        </div>
      </div>
    </section>
  );
}
