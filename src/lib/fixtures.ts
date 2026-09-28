import { FPLFixture, FPLBootstrap, FPLTeam } from '@/types/fpl';

export interface FixtureInfo {
  event: number;
  opponentShort: string;
  isHome: boolean;
  difficulty: number;
}

export function getUpcomingFixtures(
  teamId: number,
  fixtures: FPLFixture[],
  bootstrap: FPLBootstrap,
  numGameweeks: number = 3
): FixtureInfo[] {
  if (!teamId || !fixtures || !Array.isArray(fixtures) || fixtures.length === 0 || !bootstrap?.teams) {
    return [];
  }

  const teamMap = new Map<number, string>(
    bootstrap.teams.map((t: FPLTeam) => [t.id, t.short_name])
  );

  let teamFixtures = fixtures.filter(
    (f) => f && !f.finished && (f.team_h === teamId || f.team_a === teamId)
  );

  if (teamFixtures.length === 0) {
    teamFixtures = fixtures.filter((f) => f && (f.team_h === teamId || f.team_a === teamId));
  }

  return teamFixtures
    .sort((a, b) => (a.event || 99) - (b.event || 99))
    .slice(0, numGameweeks)
    .map((f) => {
      const isHome = f.team_h === teamId;
      const opponentId = isHome ? f.team_a : f.team_h;
      const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty;

      return {
        event: f.event || 0,
        opponentShort: teamMap.get(opponentId) || `T${opponentId}`,
        isHome,
        difficulty: difficulty || 3,
      };
    });
}

export function getFDRBadgeColor(difficulty: number): string {
  switch (difficulty) {
    case 1:
    case 2:
      return 'bg-[#d7f0e4] text-[#327a68] border-[#a9d7bf]';
    case 3:
      return 'bg-[#edf4f7] text-[#648198] border-[#c9e0eb]';
    case 4:
      return 'bg-[#fff0ef] text-[#b45851] border-[#efc8c4]';
    case 5:
      return 'bg-[#fbe3e1] text-[#9f4b45] border-[#e8b4af]';
    default:
      return 'bg-[#edf4f7] text-[#648198] border-[#c9e0eb]';
  }
}