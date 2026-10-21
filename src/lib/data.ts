import "server-only";
import { store } from "./store";
import { computeFinals, computeStandings } from "./standings";
import type { Game, PublicPlayer, Settings, Team } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  id: "main",
  name: "2K26 Duos Showdown",
  season: "Season 1",
  announcement: "",
  registration_open: true,
  finals_override: null,
};

export async function getSettings(): Promise<Settings> {
  const rows = await store.list("settings");
  return { ...DEFAULT_SETTINGS, ...(rows.find((r) => r.id === "main") ?? {}) };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function toPublic({ password_hash: _omit, ...rest }: { password_hash: string } & PublicPlayer): PublicPlayer {
  return rest;
}

export type Tournament = Awaited<ReturnType<typeof loadTournament>>;

/** Loads everything the public pages need in one go. */
export async function loadTournament() {
  const [players, teams, games, settings] = await Promise.all([
    store.list("players"),
    store.list("teams"),
    store.list("games"),
    getSettings(),
  ]);
  const publicPlayers = players.map(toPublic);
  const standings = computeStandings(teams, games);
  const finals = computeFinals(games);
  const rrGames = games.filter((g) => g.stage === "rr");
  const rrComplete = rrGames.length > 0 && rrGames.every((g) => g.status === "final");

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const membersOf = (teamId: string) => publicPlayers.filter((p) => p.team_id === teamId);

  let phase: "registration" | "round-robin" | "finals" | "complete" = "registration";
  if (finals?.champion) phase = "complete";
  else if (finals) phase = "finals";
  else if (rrGames.length) phase = "round-robin";

  /** Top two seeds for the finals, honouring an admin override. */
  const finalsSeeds = (): [string, string] | null => {
    const o = settings.finals_override;
    if (o?.length === 2 && teamById.has(o[0]) && teamById.has(o[1])) return [o[0], o[1]];
    if (standings.length < 2) return null;
    return [standings[0].team.id, standings[1].team.id];
  };

  return {
    players: publicPlayers,
    teams,
    games,
    settings,
    standings,
    finals,
    rrGames,
    rrComplete,
    phase,
    teamById,
    membersOf,
    finalsSeeds,
  };
}

export function gamesForTeam(games: Game[], teamId: string) {
  return games.filter((g) => g.home_team_id === teamId || g.away_team_id === teamId);
}

export function sortGames(games: Game[]) {
  return [...games].sort((a, b) => {
    if (a.stage !== b.stage) return a.stage === "rr" ? -1 : 1;
    const ta = a.scheduled_at ?? "";
    const tb = b.scheduled_at ?? "";
    return a.round - b.round || ta.localeCompare(tb) || a.created_at.localeCompare(b.created_at);
  });
}

export function teamName(teamById: Map<string, Team>, id: string) {
  return teamById.get(id)?.name ?? "Deleted team";
}
