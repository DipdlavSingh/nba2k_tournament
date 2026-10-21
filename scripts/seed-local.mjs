// Fills .data/db.json with demo players, teams and round robin results for local testing.
// Usage: npm run seed:local   (every demo player's password is "password")
import { mkdirSync, writeFileSync } from "fs";
import bcrypt from "bcryptjs";

const hash = bcrypt.hashSync("password", 10);
const now = Date.now();
const iso = (offsetDays) => new Date(now + offsetDays * 86_400_000).toISOString();
const id = () => crypto.randomUUID();

const teamDefs = [
  ["Splash Bros 2.0", "GSW", "Logo threes only."],
  ["Paint Beasts", "MEM", "We live in the post."],
  ["Clutch City", "HOU", "Ice in the veins."],
  ["Showtime", "LAL", "Lights. Camera. Lob."],
  ["Garden Party", "NYK", "MSG energy."],
  ["Heat Check", "MIA", null],
];
const names = ["Dre", "Kai", "Marcus", "Jules", "Theo", "Ravi", "Nico", "Zay", "Omar", "Leo", "Sam", "Ty"];

const teams = teamDefs.map(([name, nba_team, tagline], i) => ({
  id: id(), name, nba_team, tagline, created_at: iso(-30 + i),
}));
const players = names.map((n, i) => ({
  id: id(),
  username: n.toLowerCase(),
  password_hash: hash,
  display_name: n,
  gamertag: `${n}_2K${i}`,
  tagline: i % 3 === 0 ? "Pull-up from the logo." : null,
  avatar: null,
  team_id: teams[Math.floor(i / 2)].id,
  created_at: iso(-30),
}));
players.push({ ...players[0], id: id(), username: "rookie", display_name: "Rookie", gamertag: null, team_id: null });

// Circle-method round robin, matching src/lib/standings.ts.
const ids = teams.map((t) => t.id);
const games = [];
for (let r = 0; r < ids.length - 1; r++) {
  for (let i = 0; i < ids.length / 2; i++) {
    const flip = (r + i) % 2 === 1;
    const [home, away] = flip ? [ids[ids.length - 1 - i], ids[i]] : [ids[i], ids[ids.length - 1 - i]];
    const played = r < 3;
    const hs = 60 + ((r * 7 + i * 13) % 30);
    const as = 60 + ((r * 11 + i * 5 + 3) % 30);
    games.push({
      id: id(), stage: "rr", round: r + 1, home_team_id: home, away_team_id: away,
      scheduled_at: iso(-14 + r * 4), home_score: played ? hs : null,
      away_score: played ? (as === hs ? as + 2 : as) : null,
      status: played ? "final" : "scheduled", notes: null, created_at: iso(-20),
    });
  }
  ids.splice(1, 0, ids.pop());
}

mkdirSync(".data", { recursive: true });
writeFileSync(".data/db.json", JSON.stringify({ players, teams, games, settings: [] }, null, 2));
console.log(`Seeded ${players.length} players, ${teams.length} teams, ${games.length} games into .data/db.json`);
