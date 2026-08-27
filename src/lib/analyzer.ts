import {
  FPLBootstrap,
  FPLPicksResponse,
  ProcessedPlayer,
  AnalysisResult,
  FPLElement,
  FPLTeam,
  FPLPick,
} from '@/types/fpl';

const POSITIONS: Record<number, string> = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export function calculatePlayerScore(element: FPLElement): number {
  const form = parseFloat(element.form) || 0;
  const ppg = parseFloat(element.points_per_game) || 0;
  const ict = parseFloat(element.ict_index) || 0;
  const epNext = parseFloat(element.ep_next) || 0;

  const score = form * 0.35 + ppg * 0.25 + ict * 0.02 + epNext * 0.38;
  return parseFloat(score.toFixed(2));
}

export function analyzeSquad(
  bootstrap: FPLBootstrap,
  picksData: FPLPicksResponse
): AnalysisResult {
  const teamMap = new Map<number, string>(
    bootstrap.teams.map((t: FPLTeam) => [t.id, t.short_name])
  );
  const elementMap = new Map<number, FPLElement>(
    bootstrap.elements.map((e: FPLElement) => [e.id, e])
  );

  const picks = picksData.picks;
  const starting11Picks = picks.filter((pick: FPLPick) => pick.position <= 11);
  const benchPicks = picks.filter((pick: FPLPick) => pick.position > 11);

  const processPick = (pick: FPLPick): ProcessedPlayer => {
    const raw = elementMap.get(pick.element) || ({} as FPLElement);
    const expectedScore = calculatePlayerScore(raw);
    return {
      ...raw,
      expected_score: expectedScore,
      position_short: POSITIONS[raw.element_type] || 'UNK',
      team_short: teamMap.get(raw.team) || 'UNK',
      is_captain: pick.is_captain,
      is_vice_captain: pick.is_vice_captain,
    };
  };

  const starting11 = starting11Picks.map(processPick);
  const bench = benchPicks.map(processPick);

  const captain = starting11.find((p: ProcessedPlayer) => p.is_captain) || starting11[0] || null;
  const viceCaptain = starting11.find((p: ProcessedPlayer) => p.is_vice_captain) || starting11[1] || null;

  const totalXP = parseFloat(
    starting11.reduce((sum: number, e: ProcessedPlayer) => sum + e.expected_score, 0).toFixed(2)
  );

  const bank = (picksData.entry_history?.bank || 0) / 10;
  const teamValue = (picksData.entry_history?.value || 0) / 10;

  // Simple transfer suggestion logic
  const transferSuggestions: any[] = [];
  const lowestSquadPlayer = [...starting11].sort(
    (a: ProcessedPlayer, b: ProcessedPlayer) => a.expected_score - b.expected_score
  )[0];

  if (lowestSquadPlayer) {
    const replacement = bootstrap.elements
      .filter(
        (e: FPLElement) =>
          e.element_type === lowestSquadPlayer.element_type &&
          e.id !== lowestSquadPlayer.id &&
          e.status === 'a'
      )
      .map((e: FPLElement) => ({
        ...e,
        expected_score: calculatePlayerScore(e),
        position_short: POSITIONS[e.element_type] || 'UNK',
        team_short: teamMap.get(e.team) || 'UNK',
      }))
      .sort((a, b) => b.expected_score - a.expected_score)[0];

    if (replacement && replacement.expected_score > lowestSquadPlayer.expected_score) {
      transferSuggestions.push({
        playerOut: lowestSquadPlayer,
        playerIn: replacement,
        gain: parseFloat((replacement.expected_score - lowestSquadPlayer.expected_score).toFixed(2)),
      });
    }
  }

  return {
    starting11,
    bench,
    captain,
    viceCaptain,
    totalXP,
    bank,
    teamValue,
    transferSuggestions,
  };
}