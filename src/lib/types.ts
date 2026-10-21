export type Player = {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  gamertag: string | null;
  tagline: string | null;
  avatar: string | null;
  team_id: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  nba_team: string | null;
  tagline: string | null;
  created_at: string;
};

export type GameStage = "rr" | "final";
export type GameStatus = "scheduled" | "final";

export type Game = {
  id: string;
  stage: GameStage;
  /** Round number for round robin; game number (1-3) for the finals. */
  round: number;
  home_team_id: string;
  away_team_id: string;
  scheduled_at: string | null;
  home_score: number | null;
  away_score: number | null;
  status: GameStatus;
  notes: string | null;
  created_at: string;
};

export type Settings = {
  id: string;
  name: string;
  season: string;
  announcement: string;
  registration_open: boolean;
  /** Admin override for finals seeding: [seed1TeamId, seed2TeamId]. */
  finals_override: string[] | null;
};

/** Player data that is safe to send to the browser. */
export type PublicPlayer = Omit<Player, "password_hash">;

export type TableMap = {
  players: Player;
  teams: Team;
  games: Game;
  settings: Settings;
};
export type TableName = keyof TableMap;
