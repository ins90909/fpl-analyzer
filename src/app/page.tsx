'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { AnalyticsOverview } from '@/components/AnalyticsOverview';
import { SquadGrid } from '@/components/SquadGrid';
import { TransferSuggestions } from '@/components/TransferSuggestions';
import { PriceChangeTracker } from '@/components/PriceChangeTracker';
import { WildcardOptimizer } from '@/components/WildcardOptimizer';
import { SquadAvailabilityAlerts } from '@/components/SquadAvailabilityAlerts';
import { analyzeSquad } from '@/lib/analyzer';
import { FPLBootstrap, FPLPicksResponse, FPLFixture, AnalysisResult } from '@/types/fpl';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<FPLBootstrap | null>(null);
  const [fixtures, setFixtures] = useState<FPLFixture[] | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleSearch = async (managerId: string) => {
    if (!managerId) return;
    setLoading(true);
    setError(null);

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

      setBootstrap(bootstrapData);
      setFixtures(fixturesData);

      const result = analyzeSquad(bootstrapData, picksData);
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4fbff] text-[#16324f] px-4 py-8 sm:px-8 space-y-8 max-w-7xl mx-auto">
      <div className="text-center space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d8ca8]">Fantasy Premier League</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#16324f]">
          FPL Squad Analyzer
        </h1>
        <p className="text-sm text-[#648198]">
          Instant squad analysis, captain suggestions, and transfer optimization powered by real-time FPL data.
        </p>
      </div>

      <SearchBar onSearch={handleSearch} loading={loading} />

      {error && (
        <div className="p-4 bg-[#fff0ef] border border-[#efc8c4] text-[#b45851] rounded-lg text-center text-sm font-semibold max-w-xl mx-auto">
          {error}
        </div>
      )}

      {analysis && bootstrap && (
        <div className="space-y-8">
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
          />

          {analysis.transferSuggestions && analysis.transferSuggestions.length > 0 && (
            <TransferSuggestions suggestions={analysis.transferSuggestions} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WildcardOptimizer bootstrap={bootstrap} />
            <PriceChangeTracker bootstrap={bootstrap} />
          </div>
        </div>
      )}
    </main>
  );
}