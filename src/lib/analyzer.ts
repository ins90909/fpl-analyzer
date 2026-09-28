import {
  FPLBootstrap,
  FPLPicksResponse,
  ProcessedPlayer,
  AnalysisResult,
  FPLElement,
  FPLTeam,
  FPLPick,
  FPLFixture,
  TransferSuggestion,
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

function projectNextThreeGameweeks(
  player: FPLElement,
  bootstrap: FPLBootstrap,
  fixtures: FPLFixture[]
): number {
  const futureEvents = bootstrap.events
    .filter((event) => !event.finished)
    .sort((a, b) => a.id - b.id)
    .slice(0, 3);
  const nextGameweekScore = calculatePlayerScore(player);
  const pointsPerGame = Number.parseFloat(player.points_per_game) || nextGameweekScore;

  if (fixtures.length === 0) return Number((nextGameweekScore + pointsPerGame * 2).toFixed(2));

  const projection = futureEvents.reduce((total, event, index) => {
    const eventFixtures = fixtures.filter(
      (fixture) =>
        !fixture.finished &&
        fixture.event === event.id &&
        (fixture.team_h === player.team || fixture.team_a === player.team)
    );
    if (eventFixtures.length === 0) return total;

    const averageDifficulty =
      eventFixtures.reduce((sum, fixture) => {
        const difficulty = fixture.team_h === player.team
          ? fixture.team_h_difficulty
          : fixture.team_a_difficulty;
        return sum + difficulty;
      }, 0) / eventFixtures.length;
    const fixtureFactor = 1 + (3 - averageDifficulty) * 0.1;
    const baseline = index === 0 ? nextGameweekScore : pointsPerGame;
    return total + baseline * fixtureFactor;
  }, 0);

  return Number(projection.toFixed(2));
}

export function analyzeSquad(
  bootstrap: FPLBootstrap,
  picksData: FPLPicksResponse,
  fixtures: FPLFixture[] = []
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
      next_three_gameweek_projection: projectNextThreeGameweeks(raw, bootstrap, fixtures),
      position_short: POSITIONS[raw.element_type] || 'UNK',
      team_short: teamMap.get(raw.team) || 'UNK',
      squad_position: pick.position,
      selling_price: pick.selling_price,
      is_captain: pick.is_captain,
      is_vice_captain: pick.is_vice_captain,
    };
  };

  const starting11 = starting11Picks.map(processPick);
  const bench = benchPicks.map(processPick);

  const totalXP = parseFloat(
    starting11.reduce((sum: number, e: ProcessedPlayer) => sum + e.expected_score, 0).toFixed(2)
  );

  const bank = (picksData.entry_history?.bank || 0) / 10;
  const teamValue = (picksData.entry_history?.value || 0) / 10;

  const transferSuggestions: TransferSuggestion[] = [];
  const squadIds = new Set(picksData.picks.map((p: FPLPick) => p.element));
  const squadCounts = new Map<number, number>();
  for (const pick of picksData.picks) {
    const owned = elementMap.get(pick.element);
    if (owned) squadCounts.set(owned.team, (squadCounts.get(owned.team) ?? 0) + 1);
  }
  const proposedPlayersIn = new Set<number>();
  const currentBank = picksData.entry_history?.bank ?? 0;
  const transferOutCandidates = [...starting11].sort(
    (a, b) => a.next_three_gameweek_projection - b.next_three_gameweek_projection
  );

  for (const playerOut of transferOutCandidates) {
    const sellingPrice = playerOut.selling_price ?? playerOut.now_cost;
    const availableBudget = sellingPrice + currentBank;
    const replacement = bootstrap.elements
      .filter((player) => {
        if (
          player.element_type !== playerOut.element_type ||
          squadIds.has(player.id) ||
          proposedPlayersIn.has(player.id) ||
          player.now_cost > availableBudget ||
          player.status !== 'a' ||
          (player.chance_of_playing_next_round !== null &&
            player.chance_of_playing_next_round < 100)
        ) {
          return false;
        }

        const destinationCount = squadCounts.get(player.team) ?? 0;
        const countAfterSale = destinationCount - (player.team === playerOut.team ? 1 : 0);
        return countAfterSale < 3;
      })
      .map((player) => ({
        ...player,
        expected_score: calculatePlayerScore(player),
        next_three_gameweek_projection: projectNextThreeGameweeks(player, bootstrap, fixtures),
        position_short: POSITIONS[player.element_type] || 'UNK',
        team_short: teamMap.get(player.team) || 'UNK',
        squad_position: playerOut.squad_position,
      }))
      .sort((a, b) => b.next_three_gameweek_projection - a.next_three_gameweek_projection)[0];

    if (
      !replacement ||
      replacement.next_three_gameweek_projection <= playerOut.next_three_gameweek_projection
    ) continue;

    proposedPlayersIn.add(replacement.id);
    transferSuggestions.push({
      playerOut,
      playerIn: replacement,
      gain: parseFloat(
        (replacement.next_three_gameweek_projection - playerOut.next_three_gameweek_projection).toFixed(2)
      ),
      sellingPrice,
      availableBudget,
    });
    if (transferSuggestions.length === 3) break;
  }
  transferSuggestions.sort((a, b) => b.gain - a.gain);

  // Prefer fit starters for captain recommendations, falling back if the whole XI is flagged.
  const fitStartingXI = starting11.filter(
    (player) =>
      player.status === 'a' &&
      (player.chance_of_playing_next_round === null ||
        player.chance_of_playing_next_round >= 100)
  );
  const sortedXI = [...(fitStartingXI.length > 0 ? fitStartingXI : starting11)].sort(
    (a, b) => b.expected_score - a.expected_score
  );

  return {
    starting11,
    bench,
    captain: sortedXI[0] || null,        // Recommended Captain (Highest Score)
    viceCaptain: sortedXI[1] || null,    // Recommended Vice Captain (2nd Highest)
    totalXP,
    bank,
    teamValue,
    transferSuggestions,
  };
}