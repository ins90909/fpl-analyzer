'use client';

import { getFDRBadgeColor, getUpcomingFixtures } from '@/lib/fixtures';
import { FPLBootstrap, FPLFixture, TransferSuggestion } from '@/types/fpl';

interface TransferSuggestionsProps {
  suggestions: TransferSuggestion[];
  bootstrap: FPLBootstrap;
  fixtures: FPLFixture[];
}

export function TransferSuggestions({
  suggestions,
  bootstrap,
  fixtures,
}: TransferSuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <div className="mb-8 rounded-lg border border-[#c9e0eb] bg-white p-6 text-center text-sm text-[#7891a3]">
        No affordable, higher-projection replacement is available for the starting XI.
      </div>
    );
  }

  return (
    <section className="mb-8 rounded-lg border border-[#c9e0eb] bg-[#eaf6fb] p-6" aria-label="Transfer recommendations">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#244764]">Recommended Transfer Upgrades</h2>
        <p className="mt-1 text-xs text-[#648198]">
          Up to three affordable, position-matched options. Three-gameweek estimates use form, points per game, expected points, and fixture difficulty; they are before any hit.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {suggestions.map(({ playerOut, playerIn, gain, sellingPrice, availableBudget }) => {
          const nextFixtures = getUpcomingFixtures(playerIn.team, fixtures, bootstrap, 3);
          const remainingBank = availableBudget - playerIn.now_cost;

          return (
            <article
              key={`${playerOut.id}-${playerIn.id}`}
              className="rounded-lg border border-[#c9e0eb] bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#b45851]">Sell</div>
                  <div className="truncate font-bold text-[#244764]">{playerOut.web_name}</div>
                  <div className="text-[#7891a3]">
                    {playerOut.team_short} · £{(sellingPrice / 10).toFixed(1)}m selling value
                  </div>
                  <div className="mt-1 font-semibold text-[#b45851]">
                    {playerOut.next_three_gameweek_projection.toFixed(1)} pts · 3 GWs
                  </div>
                  <div className="text-[10px] text-[#7891a3]">
                    {playerOut.expected_score.toFixed(1)} next-GW estimate
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-center">
                  <span className="rounded border border-[#bde3d0] bg-[#e8f7f0] px-2 py-1 font-bold text-[#327a68]">→</span>
                  <span className="mt-1 text-[10px] font-bold text-[#327a68]">+{gain.toFixed(1)} pts / 3 GWs</span>
                </div>

                <div className="min-w-0 flex-1 text-right">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#327a68]">Buy</div>
                  <div className="truncate font-bold text-[#244764]">{playerIn.web_name}</div>
                  <div className="text-[#7891a3]">
                    {playerIn.team_short} · £{(playerIn.now_cost / 10).toFixed(1)}m
                  </div>
                  <div className="mt-1 font-semibold text-[#327a68]">
                    {playerIn.next_three_gameweek_projection.toFixed(1)} pts · 3 GWs
                  </div>
                  <div className="text-[10px] text-[#7891a3]">
                    {playerIn.expected_score.toFixed(1)} next-GW estimate
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#e0edf2] pt-3 text-[11px] text-[#648198]">
                <span>Bank after transfer: £{(remainingBank / 10).toFixed(1)}m</span>
                <div className="flex flex-wrap gap-1.5" aria-label="Next three fixtures">
                  {nextFixtures.map((fixture) => (
                    <span
                      key={`${fixture.event}-${fixture.opponentShort}`}
                      className={`rounded border px-1.5 py-0.5 font-semibold ${getFDRBadgeColor(fixture.difficulty)}`}
                      title={`GW${fixture.event}: ${fixture.isHome ? 'home' : 'away'}, difficulty ${fixture.difficulty}`}
                    >
                      {fixture.opponentShort} {fixture.isHome ? '(H)' : '(A)'}
                    </span>
                  ))}
                  {nextFixtures.length === 0 && <span>Fixture data unavailable</span>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
