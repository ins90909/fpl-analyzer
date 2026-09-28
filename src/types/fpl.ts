export interface FPLElement {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  element_type: number;
  team: number;
  now_cost: number;
  selected_by_percent: string;
  form: string;
  points_per_game: string;
  ict_index: string;
  total_points: number;
  ep_next: string;
  status: string;
  chance_of_playing_next_round: number | null;
  transfers_in_event: number;
  transfers_out_event: number;
  news?: string;
  news_added?: string | null;
}

export interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
  strength: number;
}

export interface FPLEvent {
  id: number;
  name: string;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
}

export interface FPLBootstrap {
  elements: FPLElement[];
  teams: FPLTeam[];
  events: FPLEvent[];
}

export interface FPLPick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface FPLPicksResponse {
  picks: FPLPick[];
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    rank?: number;
    overall_rank: number;
    bank: number;
    value: number;
  };
}

export interface FPLLiveElement {
  id: number;
  stats: {
    total_points: number;
  };
}

export interface FPLLiveResponse {
  elements: FPLLiveElement[];
}

export interface FPLManagerHistory {
  current: Array<{
    event: number;
    points: number;
    total_points: number;
    rank: number;
    overall_rank: number;
    bank: number;
    value: number;
    event_transfers: number;
    event_transfers_cost: number;
  }>;
  past: Array<{
    season_name: string;
    total_points: number;
    rank: number;
  }>;
  chips: Array<{
    name: string;
    time: string;
    event: number;
  }>;
}

export interface FPLTransfer {
  element_in: number;
  element_out: number;
  event: number;
  time: string;
  element_in_cost: number;
  element_out_cost: number;
}

export interface FPLManagerData {
  history: FPLManagerHistory;
  transfers: FPLTransfer[];
}

export interface FPLLeagueStandings {
  league: {
    id: number;
    name: string;
  };
  standings: {
    page: number;
    results: Array<{
      id: number;
      event_total: number;
      player_name: string;
      rank: number;
      last_rank: number;
      total: number;
      entry: number;
      entry_name: string;
    }>;
  };
}

export interface FPLPlayerSummary {
  history: Array<{
    round: number;
    total_points: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    bonus: number;
    opponent_team: number;
    was_home: boolean;
  }>;
  fixtures: Array<{
    id: number;
    event: number | null;
    team_h: number;
    team_a: number;
    is_home: boolean;
    difficulty: number;
  }>;
}

export interface FPLFixture {
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  finished: boolean;
}

export interface ProcessedPlayer extends FPLElement {
  expected_score: number;
  position_short: string;
  team_short: string;
  is_captain?: boolean;      // <-- ADD THIS
  is_vice_captain?: boolean; // <-- ADD THIS
}

export interface AnalysisResult {
  starting11: ProcessedPlayer[];
  bench: ProcessedPlayer[];
  captain: ProcessedPlayer | null;
  viceCaptain: ProcessedPlayer | null;
  totalXP: number;
  bank: number;
  teamValue: number;
  transferSuggestions: any[];
}