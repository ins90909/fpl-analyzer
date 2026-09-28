'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { AnalyticsOverview } from '@/components/AnalyticsOverview';
import { SquadGrid } from '@/components/SquadGrid';
import { TransferSuggestions } from '@/components/TransferSuggestions';
import { PriceChangeTracker } from '@/components/PriceChangeTracker';
import { WildcardOptimizer } from '@/components/WildcardOptimizer';
import { SquadAvailabilityAlerts } from '@/components/SquadAvailabilityAlerts';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GameweekResults } from '@/components/GameweekResults';
import { ManagerFeatures } from '@/components/ManagerFeatures';
import { PlayerDetailsModal } from '@/components/PlayerDetailsModal';
import { analyzeSquad } from '@/lib/analyzer';
import {
  FPLBootstrap,
  FPLPicksResponse,
  FPLFixture,
  FPLLiveResponse,
  AnalysisResult,
} from '@/types/fpl';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<FPLBootstrap | null>(null);
  const [fixtures, setFixtures] = useState<FPLFixture[] | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [picksData, setPicksData] = useState<FPLPicksResponse | null>(null);
  const [liveData, setLiveData] = useState<FPLLiveResponse | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const handleSearch = async (managerId: string) => {
    if (!managerId) return;
    setLoading(true);
    setError(null);
    setManagerId(null);
    setSelectedEventId(null);
    setPicksData(null);
    setLiveData(null);
    setSelectedPlayerId(null);
    setBootstrap(null);
    setFixtures(null);
    setAnalysis(null);

    try {
      const [bootstrapRes, fixturesRes, picksRes] = await Promise.all([
        fetch('/api/fpl/bootstrap'),
        fetch('/api/fpl/fixtures'),
        fetch(`/api/fpl/picks/${managerId}`),
      ]);

      if (!bootstrapRes.ok) throw new Error('Failed to fetch static FPL data.');
      if (!picksRes.ok) {
        if (picksRes.status === 404) {
          throw new Error(`Manager ID ${managerId} not found or active squad unavailable.`);
        }
        throw new Error('Failed to fetch manager squad picks.');
      }

      const bootstrapData: FPLBootstrap = await bootstrapRes.json();
      const fixturesData: FPLFixture[] = fixturesRes.ok ? await fixturesRes.json() : [];
      const picksData: FPLPicksResponse = await picksRes.json();
      const eventId = picksData.entry_history.event;
      const liveRes = await fetch(`/api/fpl/live/${eventId}`);
      if (!liveRes.ok) throw new Error('Failed to fetch gameweek points.');
      const liveData: FPLLiveResponse = await liveRes.json();

      setManagerId(managerId);
      setBootstrap(bootstrapData);
      setFixtures(fixturesData);
      setPicksData(picksData);
      setLiveData(liveData);
      setSelectedEventId(eventId);
      setAnalysis(analyzeSquad(bootstrapData, picksData));
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = async (eventId: number) => {
    if (!managerId || !bootstrap) return;
    setLoading(true);
    setError(null);

    try {
      const [picksRes, liveRes] = await Promise.all([
        fetch(`/api/fpl/picks/${managerId}?event=${eventId}`),
        fetch(`/api/fpl/live/${eventId}`),
      ]);

      if (!picksRes.ok) {
        if (picksRes.status === 404) {
          throw new Error(`No squad picks found for Gameweek ${eventId}.`);
        }
        throw new Error(`Failed to fetch Gameweek ${eventId} picks.`);
      }
      if (!liveRes.ok) throw new Error(`Failed to fetch Gameweek ${eventId} points.`);

      const [nextPicks, nextLiveData]: [FPLPicksResponse, FPLLiveResponse] =
        await Promise.all([picksRes.json(), liveRes.json()]);
      setPicksData(nextPicks);
      setLiveData(nextLiveData);
      setSelectedEventId(eventId);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const availableEvents =
    bootstrap?.events
      .filter((event) => event.finished || event.is_current || event.is_next)
      .sort((a, b) => a.id - b.id) ?? [];
  const selectedEvent = bootstrap?.events.find((event) => event.id === selectedEventId);

  return (
    <main className="min-h-screen bg-[#f4fbff] text-[#16324f] px-4 py-8 sm:px-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-4">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <div className="text-center space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d8ca8]">Fantasy Premier League</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#16324f]">
            FPL Squad Analyzer
          </h1>
          <p className="text-sm text-[#648198]">
            Instant squad analysis, captain suggestions, and transfer optimization powered by real-time FPL data.
          </p>
        </div>
      </div>

      <SearchBar onSearch={handleSearch} loading={loading} />

      {managerId && selectedEventId !== null && availableEvents.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <label htmlFor="gameweek-select" className="text-sm font-semibold text-[#244764]">
            View gameweek
          </label>
          <select
            id="gameweek-select"
            value={selectedEventId}
            onChange={(event) => void handleEventChange(Number(event.target.value))}
            disabled={loading}
            className="rounded-lg border border-[#c9e0eb] bg-white px-3 py-2 text-sm text-[#16324f] shadow-sm focus:outline-none focus:border-[#55b89a] disabled:opacity-60"
          >
            {availableEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}{event.finished ? ' · Completed' : event.is_current ? ' · In progress' : ' · Upcoming'}
              </option>
            ))}
          </select>
          {loading && <span className="text-xs text-[#648198]">Loading gameweek…</span>}
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#fff0ef] border border-[#efc8c4] text-[#b45851] rounded-lg text-center text-sm font-semibold max-w-xl mx-auto">
          {error}
        </div>
      )}

      {analysis && bootstrap && (
        <>
          {managerId && selectedEventId !== null && picksData && (
            <ManagerFeatures
              managerId={managerId}
              eventId={selectedEventId}
              picks={picksData}
              bootstrap={bootstrap}
            />
          )}
          {selectedEvent?.finished && picksData && liveData && (
            <GameweekResults
              gameweek={selectedEvent.id}
              picks={picksData}
              liveData={liveData}
              bootstrap={bootstrap}
              onPlayerSelect={setSelectedPlayerId}
            />
          )}

          <section className="space-y-8" aria-label="Squad analysis and planning tools">
            <h2 className="text-lg font-bold text-[#244764]">Squad analysis &amp; planning</h2>
            <AnalyticsOverview
              captainRecommendation={analysis.captain}
              viceCaptainRecommendation={analysis.viceCaptain}
              totalXP={analysis.totalXP}
              bank={analysis.bank}
              teamValue={analysis.teamValue}
            />

            <SquadAvailabilityAlerts
              starting11={analysis.starting11}
              bench={analysis.bench}
            />

            <SquadGrid
              starting11={analysis.starting11}
              bench={analysis.bench}
              bootstrap={bootstrap}
              fixtures={fixtures}
              onPlayerSelect={setSelectedPlayerId}
            />

            {analysis.transferSuggestions && analysis.transferSuggestions.length > 0 && (
              <TransferSuggestions suggestions={analysis.transferSuggestions} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <WildcardOptimizer bootstrap={bootstrap} />
              <PriceChangeTracker bootstrap={bootstrap} />
            </div>
          </section>
        </>
      )}
      {bootstrap && (
        <PlayerDetailsModal
          playerId={selectedPlayerId}
          bootstrap={bootstrap}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </main>
  );
}