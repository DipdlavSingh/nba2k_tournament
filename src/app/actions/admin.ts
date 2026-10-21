"use server";

import bcrypt from "bcryptjs";
import { store, UserError } from "@/lib/store";
import { getSettings, loadTournament } from "@/lib/data";
import { nbaTeam } from "@/lib/nba";
import { optInt, optStr, runAction, str, validPassword, validUsername } from "@/lib/form";
import { requireAdmin } from "@/lib/session";
import { roundRobinPairings } from "@/lib/standings";
import type { Game, GameStage, Team } from "@/lib/types";

const now = () => new Date().toISOString();

function isoOrNull(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new UserError("Invalid date/time.");
  return d.toISOString();
}

/* ---------- settings ---------- */

export async function saveSettings(fd: FormData) {
  await requireAdmin();
  await runAction("/admin", async () => {
    const current = await getSettings();
    const s1 = str(fd, "seed1");
    const s2 = str(fd, "seed2");
    if ((s1 || s2) && (!s1 || !s2 || s1 === s2)) {
      throw new UserError("To override finals seeding pick two different teams (or leave both on Auto).");
    }
    const next = {
      ...current,
      name: str(fd, "name", 60) || current.name,
      season: str(fd, "season", 40),
      announcement: str(fd, "announcement", 280),
      registration_open: fd.get("registration_open") === "on",
      finals_override: s1 && s2 ? [s1, s2] : null,
    };
    const exists = (await store.list("settings")).some((r) => r.id === "main");
    if (exists) await store.update("settings", "main", next);
    else await store.insert("settings", next);
    return "Settings saved.";
  });
}

/* ---------- players ---------- */

async function assertRoom(teamId: string | null, playerIds: string[]) {
  if (!teamId) return;
  const players = await store.list("players");
  const others = players.filter((p) => p.team_id === teamId && !playerIds.includes(p.id));
  if (others.length + playerIds.length > 2) throw new UserError("A team can only have 2 members.");
}

export async function createPlayer(fd: FormData) {
  await requireAdmin();
  await runAction("/admin/players", async () => {
    const username = validUsername(str(fd, "username"));
    const pw = validPassword(String(fd.get("password") ?? ""));
    if ((await store.list("players")).some((p) => p.username === username)) {
      throw new UserError("That username is taken.");
    }
    const teamId = optStr(fd, "team_id");
    const id = crypto.randomUUID();
    await assertRoom(teamId, [id]);
    await store.insert("players", {
      id,
      username,
      password_hash: await bcrypt.hash(pw, 10),
      display_name: str(fd, "display_name", 30) || username,
      gamertag: optStr(fd, "gamertag", 30),
      tagline: optStr(fd, "tagline", 80),
      avatar: null,
      team_id: teamId,
      created_at: now(),
    });
    return `Player ${username} created.`;
  });
}

export async function updatePlayer(fd: FormData) {
  await requireAdmin();
  await runAction("/admin/players", async () => {
    const id = str(fd, "id");
    const players = await store.list("players");
    const player = players.find((p) => p.id === id);
    if (!player) throw new UserError("Player not found.");
    const username = validUsername(str(fd, "username"));
    if (players.some((p) => p.username === username && p.id !== id)) throw new UserError("That username is taken.");
    const teamId = optStr(fd, "team_id");
    if (teamId !== player.team_id) await assertRoom(teamId, [id]);
    await store.update("players", id, {
      username,
      display_name: str(fd, "display_name", 30) || username,
      gamertag: optStr(fd, "gamertag", 30),
      tagline: optStr(fd, "tagline", 80),
      team_id: teamId,
      ...(fd.get("clear_avatar") === "on" ? { avatar: null } : {}),
    });
    const pw = String(fd.get("new_password") ?? "");
    if (pw) await store.update("players", id, { password_hash: await bcrypt.hash(validPassword(pw), 10) });
    return `Saved ${username}.`;
  });
}

export async function deletePlayer(fd: FormData) {
  await requireAdmin();
  await runAction("/admin/players", async () => {
    await store.remove("players", str(fd, "id"));
    return "Player deleted.";
  });
}

/* ---------- teams ---------- */

async function validateTeam(fd: FormData, teamId: string | null) {
  const name = str(fd, "name", 30);
  if (!name) throw new UserError("Team name is required.");
  const code = optStr(fd, "nba_team", 3);
  if (code && !nbaTeam(code)) throw new UserError("Pick a valid NBA team.");
  const teams = await store.list("teams");
  if (code && teams.some((t) => t.nba_team === code && t.id !== teamId)) {
    throw new UserError(`${nbaTeam(code)!.name} are already taken.`);
  }
  if (teams.some((t) => t.name.toLowerCase() === name.toLowerCase() && t.id !== teamId)) {
    throw new UserError("Another team already uses that name.");
  }
  const members = [str(fd, "member1"), str(fd, "member2")].filter(Boolean);
  if (members.length === 2 && members[0] === members[1]) throw new UserError("Pick two different players.");
  const players = await store.list("players");
  for (const m of members) {
    const p = players.find((x) => x.id === m);
    if (!p) throw new UserError("Player not found.");
    if (p.team_id && p.team_id !== teamId) {
      throw new UserError(`${p.display_name} is already on another team. Remove them there first.`);
    }
  }
  return { name, nba_team: code, tagline: optStr(fd, "tagline", 80), members, players };
}

export async function createTeam(fd: FormData) {
  await requireAdmin();
  await runAction("/admin/teams", async () => {
    const { name, nba_team, tagline, members } = await validateTeam(fd, null);
    const team = { name, nba_team, tagline };
    const id = crypto.randomUUID();
    await store.insert("teams", { id, ...team, created_at: now() } satisfies Team);
    for (const m of members) await store.update("players", m, { team_id: id });
    return `Team ${team.name} created.`;
  });
}

export async function updateTeam(fd: FormData) {
  await requireAdmin();
  await runAction("/admin/teams", async () => {
    const id = str(fd, "id");
    const { members, players, ...team } = await validateTeam(fd, id);
    await store.update("teams", id, team);
    for (const p of players) {
      if (p.team_id === id && !members.includes(p.id)) await store.update("players", p.id, { team_id: null });
    }
    for (const m of members) await store.update("players", m, { team_id: id });
    return `Saved ${team.name}.`;
  });
}

export async function deleteTeam(fd: FormData) {
  await requireAdmin();
  await runAction("/admin/teams", async () => {
    const id = str(fd, "id");
    // Done explicitly as well so both stores behave the same.
    for (const p of await store.list("players")) {
      if (p.team_id === id) await store.update("players", p.id, { team_id: null });
    }
    for (const g of await store.list("games")) {
      if (g.home_team_id === id || g.away_team_id === id) await store.remove("games", g.id);
    }
    await store.remove("teams", id);
    return "Team deleted. Its players are free agents again and its games were removed.";
  });
}

/* ---------- games ---------- */

function newGame(stage: GameStage, round: number, home: string, away: string, at: string | null): Game {
  return {
    id: crypto.randomUUID(),
    stage,
    round,
    home_team_id: home,
    away_team_id: away,
    scheduled_at: at,
    home_score: null,
    away_score: null,
    status: "scheduled",
    notes: null,
    created_at: now(),
  };
}

export async function generateSchedule(fd: FormData) {
  await requireAdmin();
  await runAction("/admin/games", async () => {
    const teams = await store.list("teams");
    if (teams.length < 2) throw new UserError("You need at least 2 teams.");
    const games = await store.list("games");
    const existing = games.filter((g) => g.stage === "rr");
    if (existing.length && fd.get("replace") !== "on") {
      throw new UserError('A round robin schedule already exists. Tick "Replace existing" to rebuild it.');
    }
    for (const g of existing) await store.remove("games", g.id);

    const start = isoOrNull(fd, "start");
    const gap = optInt(fd, "days_between") ?? 7;
    const pairings = roundRobinPairings(teams.map((t) => t.id));
    for (const p of pairings) {
      const at = start ? new Date(new Date(start).getTime() + (p.round - 1) * gap * 86_400_000).toISOString() : null;
      await store.insert("games", newGame("rr", p.round, p.home, p.away, at));
    }
    const rounds = Math.max(...pairings.map((p) => p.round));
    return `Created ${pairings.length} games over ${rounds} rounds.`;
  });
}

export async function addGame(fd: FormData) {
  await requireAdmin();
  await runAction("/admin/games", async () => {
    const home = str(fd, "home_team_id");
    const away = str(fd, "away_team_id");
    if (!home || !away || home === away) throw new UserError("Pick two different teams.");
    const stage: GameStage = str(fd, "stage") === "final" ? "final" : "rr";
    await store.insert("games", newGame(stage, optInt(fd, "round") ?? 1, home, away, isoOrNull(fd, "scheduled_at")));
    return "Game added.";
  });
}

export async function updateGame(fd: FormData) {
  await requireAdmin();
  await runAction("/admin/games", async () => {
    const id = str(fd, "id");
    const home = str(fd, "home_team_id");
    const away = str(fd, "away_team_id");
    if (!home || !away || home === away) throw new UserError("Pick two different teams.");
    const homeScore = optInt(fd, "home_score");
    const awayScore = optInt(fd, "away_score");
    const status = str(fd, "status") === "final" ? "final" : "scheduled";
    if (status === "final") {
      if (homeScore === null || awayScore === null) throw new UserError("Enter both scores to mark a game final.");
      if (homeScore === awayScore) throw new UserError("NBA 2K games can't end in a tie. Check the score.");
    }
    await store.update("games", id, {
      home_team_id: home,
      away_team_id: away,
      round: optInt(fd, "round") ?? 1,
      scheduled_at: isoOrNull(fd, "scheduled_at"),
      home_score: homeScore,
      away_score: awayScore,
      status,
      notes: optStr(fd, "notes", 140),
    });
    return status === "final" ? "Final score saved." : "Game saved.";
  });
}

export async function deleteGame(fd: FormData) {
  await requireAdmin();
  await runAction("/admin/games", async () => {
    await store.remove("games", str(fd, "id"));
    return "Game deleted.";
  });
}

export async function createFinals(fd: FormData) {
  await requireAdmin();
  await runAction("/admin/games", async () => {
    const t = await loadTournament();
    const existing = t.games.filter((g) => g.stage === "final");
    if (existing.length && fd.get("replace") !== "on") {
      throw new UserError('Finals already exist. Tick "Replace existing" to re-seed them.');
    }
    const seeds = t.finalsSeeds();
    if (!seeds) throw new UserError("You need at least 2 teams.");
    for (const g of existing) await store.remove("games", g.id);
    const [s1, s2] = seeds;
    const start = isoOrNull(fd, "start");
    const at = (i: number) => (start ? new Date(new Date(start).getTime() + i * 3_600_000).toISOString() : null);
    // Best of 3: the higher seed hosts games 1 and 3.
    await store.insert("games", newGame("final", 1, s1, s2, at(0)));
    await store.insert("games", newGame("final", 2, s2, s1, at(1)));
    await store.insert("games", newGame("final", 3, s1, s2, at(2)));
    return `Finals set: ${t.teamById.get(s1)?.name} vs ${t.teamById.get(s2)?.name}.`;
  });
}
