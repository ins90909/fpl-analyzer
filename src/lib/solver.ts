import { ProcessedPlayer } from '@/types/fpl';

export interface OptimizationResult {
  starting11: ProcessedPlayer[];
  bench: ProcessedPlayer[];
  captain: ProcessedPlayer | null;
  viceCaptain: ProcessedPlayer | null;
  totalExpectedPoints: number;
}

export function optimizeSquad(
  players: ProcessedPlayer[],
  budget: number = 1000
): OptimizationResult {
  const sorted = [...players].sort((a, b) => b.expected_score - a.expected_score);

  const selected: ProcessedPlayer[] = [];
  let currentCost = 0;

  for (const player of sorted) {
    if (selected.length < 15 && currentCost + player.now_cost <= budget) {
      selected.push(player);
      currentCost += player.now_cost;
    }
  }

  const starting11 = selected.slice(0, 11);
  const bench = selected.slice(11, 15);

  const captain = starting11[0] || null;
  const viceCaptain = starting11[1] || null;

  const rawSolution: unknown = {
    starting11,
    bench,
    captain,
    viceCaptain,
  };

  // Explicit type assertion to prevent TS2322 'unknown' assignment error
  const solutionRecord = rawSolution as Record<string, any>;

  const totalExpectedPoints = (solutionRecord.starting11 as ProcessedPlayer[]).reduce(
    (sum, p) => sum + p.expected_score,
    0
  );

  return {
    starting11: solutionRecord.starting11,
    bench: solutionRecord.bench,
    captain: solutionRecord.captain,
    viceCaptain: solutionRecord.viceCaptain,
    totalExpectedPoints,
  };
}