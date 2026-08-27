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
    rank: number;
    overall_rank: number;
    bank: number;
    value: number;
  };
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