import Link from "next/link";
import type { Metadata } from "next";
import { Avatar } from "@/components/Avatar";
import { TeamBadge } from "@/components/TeamBadge";
import { Panel } from "@/components/ui";
import { loadTournament } from "@/lib/data";
import { nbaTeam, teamColors } from "@/lib/nba";
import type { PublicPlayer } from "@/lib/types";
import type { StandingRow } from "@/lib/standings";

export const metadata: Metadata = { title: "Players" };

export default async function PlayersPage() {
  const t = await loadTournament();
  const rowByTeam = new Map(t.standings.map((r) => [r.team.id, r]));
  // Players on teams follow leaderboard order; free agents go last.
  const players = [...t.players].sort((a, b) => {
    const ra = a.team_id ? (rowByTeam.get(a.team_id)?.rank ?? 999) : 1000;
    const rb = b.team_id ? (rowByTeam.get(b.team_id)?.rank ?? 999) : 1000;
    return ra - rb || a.display_name.localeCompare(b.display_name);
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-6xl leading-none">Players</h1>
        <span className="text-xs font-bold uppercase tracking-widest text-mute">
          {t.players.length} players · {t.players.filter((p) => !p.team_id).length} free agents
        </span>
      </div>
      {players.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {players.map((p) => (
            <PlayerCard key={p.id} player={p} row={p.team_id ? rowByTeam.get(p.team_id) : undefined} />
          ))}
        </div>
      ) : (
        <Panel>
          <p className="text-mute">No players have signed up yet.</p>
        </Panel>
      )}
    </div>
  );
}

function PlayerCard({ player, row }: { player: PublicPlayer; row: StandingRow | undefined }) {
  const team = row?.team;
  const { primary, secondary } = teamColors(team?.nba_team);
  const nba = nbaTeam(team?.nba_team);
  return (
    <div className="panel overflow-hidden p-0">
      <div
        className="relative flex flex-col items-center gap-3 px-5 pb-5 pt-6 text-center"
        style={{ background: `linear-gradient(160deg, ${primary}aa, ${primary}22 60%, transparent 90%)` }}
      >
        <div
          className="absolute inset-y-0 right-0 w-16 opacity-25"
          style={{ background: `repeating-linear-gradient(115deg, ${secondary} 0 6px, transparent 6px 16px)` }}
        />
        <Avatar src={player.avatar} name={player.display_name} size={120} accent={primary} />
        <div className="relative min-w-0 max-w-full">
          <div className="truncate font-display text-3xl leading-none">{player.display_name}</div>
          {player.gamertag ? (
            <div className="mt-1 truncate text-xs font-bold uppercase tracking-widest text-ice">{player.gamertag}</div>
          ) : null}
          {player.tagline ? <p className="mt-2 text-sm italic text-white/80">&ldquo;{player.tagline}&rdquo;</p> : null}
        </div>
      </div>
      <div className="border-t border-line p-4">
        {row && team ? (
          <Link href={`/teams/${team.id}`} className="flex items-center gap-3 hover:text-gold">
            <TeamBadge code={team.nba_team} name={team.name} size={34} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-lg leading-tight">{team.name}</span>
              <span className="block truncate text-xs font-bold uppercase tracking-widest text-mute">
                {nba ? `${nba.city} ${nba.name}` : "No NBA team yet"}
              </span>
            </span>
            <span className="text-right">
              <span className="stat-num block text-xl">{row.w}-{row.l}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-mute">#{row.rank}</span>
            </span>
          </Link>
        ) : (
          <span className="chip">Free agent</span>
        )}
      </div>
    </div>
  );
}
