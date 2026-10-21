import type { Game, Team } from "./types";

export type Tiebreaker = "H2H" | "PD" | "PF" | "PA" | "NAME";

export type StandingRow = {
  team: Team;
  rank: number;
  gp: number;
  w: number;
  l: number;
  pct: number;
  pf: number;
  pa: number;
  pd: number;
  /** Games remaining on the round robin schedule. */
  remaining: number;
  streak: string;
  last5: ("W" | "L")[];
  /** Which tiebreaker placed this team below the team directly above it. */
  tiebreak: Tiebreaker | null;
};

export const TIEBREAK_LABELS: Record<Tiebreaker, string> = {
  H2H: "Head-to-head record",
  PD: "Point differential",
  PF: "Points scored",
  PA: "Fewest points allowed",
  NAME: "Alphabetical (admin can override)",
};

export function isPlayed(g: Game): g is Game & { home_score: number; away_score: number } {
  return g.status === "final" && g.home_score !== null && g.away_score !== null;
}

export function winnerOf(g: Game): string | null {
  if (!isPlayed(g) || g.home_score === g.away_score) return null;
  return g.home_score > g.away_score ? g.home_team_id : g.away_team_id;
}

function byTime(a: Game, b: Game) {
  const ta = a.scheduled_at ?? a.created_at;
  const tb = b.scheduled_at ?? b.created_at;
  return a.round - b.round || ta.localeCompare(tb);
}

/**
 * Round robin standings. Order: win %, then head-to-head win % among all
 * teams tied on win %, then point differential, points scored, fewest points
 * allowed, and finally team name.
 */
export function computeStandings(teams: Team[], games: Game[]): StandingRow[] {
  const rr = games.filter((g) => g.stage === "rr");
  const played = rr.filter(isPlayed).sort(byTime);

  const rows = new Map<string, StandingRow>();
  for (const team of teams) {
    rows.set(team.id, {
      team, rank: 0, gp: 0, w: 0, l: 0, pct: 0, pf: 0, pa: 0, pd: 0,
      remaining: 0, streak: "-", last5: [], tiebreak: null,
    });
  }
  const results = new Map<string, ("W" | "L")[]>();

  for (const g of rr) {
    if (isPlayed(g)) continue;
    for (const id of [g.home_team_id, g.away_team_id]) {
      const row = rows.get(id);
      if (row) row.remaining++;
    }
  }

  for (const g of played) {
    const home = rows.get(g.home_team_id);
    const away = rows.get(g.away_team_id);
    if (!home || !away) continue;
    const homeWon = g.home_score > g.away_score;
    for (const [row, us, them, won] of [
      [home, g.home_score, g.away_score, homeWon],
      [away, g.away_score, g.home_score, !homeWon],
    ] as const) {
      row.gp++;
      row.pf += us;
      row.pa += them;
      if (won) row.w++;
      else row.l++;
      const list = results.get(row.team.id) ?? [];
      list.push(won ? "W" : "L");
      results.set(row.team.id, list);
    }
  }

  for (const row of rows.values()) {
    row.pd = row.pf - row.pa;
    row.pct = row.gp ? row.w / row.gp : 0;
    const list = results.get(row.team.id) ?? [];
    row.last5 = list.slice(-5);
    if (list.length) {
      const last = list[list.length - 1];
      let n = 0;
      for (let i = list.length - 1; i >= 0 && list[i] === last; i--) n++;
      row.streak = `${last}${n}`;
    }
  }

  // Group by win %, then resolve each tied group.
  const all = [...rows.values()].sort((a, b) => b.pct - a.pct);
  const ordered: StandingRow[] = [];
  for (let i = 0; i < all.length; ) {
    let j = i;
    while (j < all.length && all[j].pct === all[i].pct) j++;
    ordered.push(...resolveTie(all.slice(i, j), played));
    i = j;
  }

  ordered.forEach((row, i) => (row.rank = i + 1));
  return ordered;
}

function resolveTie(group: StandingRow[], played: (Game & { home_score: number; away_score: number })[]) {
  if (group.length < 2) return group;
  const ids = new Set(group.map((r) => r.team.id));
  const h2h = new Map<string, { w: number; gp: number }>();
  for (const r of group) h2h.set(r.team.id, { w: 0, gp: 0 });
  for (const g of played) {
    if (!ids.has(g.home_team_id) || !ids.has(g.away_team_id)) continue;
    const winner = g.home_score > g.away_score ? g.home_team_id : g.away_team_id;
    for (const id of [g.home_team_id, g.away_team_id]) {
      const rec = h2h.get(id)!;
      rec.gp++;
      if (id === winner) rec.w++;
    }
  }
  const h2hPct = (r: StandingRow) => {
    const rec = h2h.get(r.team.id)!;
    return rec.gp ? rec.w / rec.gp : 0;
  };

  const criteria: [Tiebreaker, (a: StandingRow, b: StandingRow) => number][] = [
    ["H2H", (a, b) => h2hPct(b) - h2hPct(a)],
    ["PD", (a, b) => b.pd - a.pd],
    ["PF", (a, b) => b.pf - a.pf],
    ["PA", (a, b) => a.pa - b.pa],
    ["NAME", (a, b) => a.team.name.localeCompare(b.team.name)],
  ];

  const sorted = [...group].sort((a, b) => {
    for (const [, cmp] of criteria) {
      const d = cmp(a, b);
      if (d !== 0) return d;
    }
    return 0;
  });
  // Teams with no games yet are not really "tied", so don't label them.
  for (let k = 1; k < sorted.length; k++) {
    if (sorted[k].gp === 0 && sorted[k - 1].gp === 0) continue;
    const decider = criteria.find(([, cmp]) => cmp(sorted[k - 1], sorted[k]) !== 0);
    sorted[k].tiebreak = decider ? decider[0] : null;
  }
  return sorted;
}

export type FinalsSeries = {
  games: Game[];
  seed1: string;
  seed2: string;
  wins: Record<string, number>;
  champion: string | null;
};

export function computeFinals(games: Game[]): FinalsSeries | null {
  const finals = games.filter((g) => g.stage === "final").sort(byTime);
  if (!finals.length) return null;
  const first = finals[0];
  const seed1 = first.home_team_id;
  const seed2 = first.away_team_id;
  const wins: Record<string, number> = { [seed1]: 0, [seed2]: 0 };
  for (const g of finals) {
    const w = winnerOf(g);
    if (w && w in wins) wins[w]++;
  }
  const champion = wins[seed1] >= 2 ? seed1 : wins[seed2] >= 2 ? seed2 : null;
  return { games: finals, seed1, seed2, wins, champion };
}

/** Circle-method round robin: every team plays every other team exactly once. */
export function roundRobinPairings(teamIds: string[]): { round: number; home: string; away: string }[] {
  const ids: (string | null)[] = [...teamIds];
  if (ids.length % 2) ids.push(null);
  const n = ids.length;
  const out: { round: number; home: string; away: string }[] = [];
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = ids[i];
      const b = ids[n - 1 - i];
      if (!a || !b) continue;
      // Alternate home/away so nobody is always the home team.
      const flip = (r + i) % 2 === 1;
      out.push({ round: r + 1, home: flip ? b : a, away: flip ? a : b });
    }
    ids.splice(1, 0, ids.pop()!);
  }
  return out;
}
