import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "./Avatar";
import { TeamBadge } from "./TeamBadge";
import { LocalTime } from "./client";
import { NBA_TEAMS, nbaTeam, teamColors } from "@/lib/nba";
import { winnerOf } from "@/lib/standings";
import type { Game, PublicPlayer, Team } from "@/lib/types";

export function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (!ok && !err) return null;
  return (
    <div
      role="status"
      className={`rise mb-6 border-l-4 px-4 py-3 font-semibold ${
        err ? "border-accent bg-accent/10 text-[#ff9aa6]" : "border-win bg-win/10 text-win"
      }`}
    >
      {err ?? ok}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`panel p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export function NbaTeamOptions({ taken, current }: { taken: Set<string>; current: string | null }) {
  return (
    <>
      <option value="">— No NBA team —</option>
      {NBA_TEAMS.map((t) => {
        const isTaken = taken.has(t.code) && t.code !== current;
        return (
          <option key={t.code} value={t.code} disabled={isTaken}>
            {t.city} {t.name}
            {isTaken ? " (taken)" : ""}
          </option>
        );
      })}
    </>
  );
}

export function TeamLabel({ team, size = 36, link = true }: { team: Team | undefined; size?: number; link?: boolean }) {
  if (!team) return <span className="text-mute">Deleted team</span>;
  const body = (
    <span className="flex min-w-0 items-center gap-3">
      <TeamBadge code={team.nba_team} name={team.name} size={size} />
      <span className="min-w-0">
        <span className="block truncate font-display text-lg leading-tight">{team.name}</span>
        <span className="block truncate text-xs font-bold uppercase tracking-widest text-mute">
          {nbaTeam(team.nba_team) ? `${nbaTeam(team.nba_team)!.city} ${nbaTeam(team.nba_team)!.name}` : "No NBA team yet"}
        </span>
      </span>
    </span>
  );
  return link ? (
    <Link href={`/teams/${team.id}`} className="min-w-0 hover:text-gold">
      {body}
    </Link>
  ) : (
    body
  );
}

export function GameCard({ game, teamById, highlight }: { game: Game; teamById: Map<string, Team>; highlight?: string }) {
  const home = teamById.get(game.home_team_id);
  const away = teamById.get(game.away_team_id);
  const winner = winnerOf(game);
  const final = game.status === "final";
  const side = (team: Team | undefined, score: number | null, id: string) => (
    <div className={`flex items-center justify-between gap-3 ${final && winner !== id ? "opacity-55" : ""}`}>
      <TeamLabel team={team} size={30} />
      <span className={`stat-num text-3xl ${winner === id ? "text-gold" : ""} ${highlight === id ? "underline decoration-accent" : ""}`}>
        {score ?? "–"}
      </span>
    </div>
  );
  return (
    <div className="panel space-y-2 p-4">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-mute">
        <span>{game.stage === "final" ? `Finals · Game ${game.round}` : `Round ${game.round}`}</span>
        <span className={final ? "text-win" : ""}>{final ? "Final" : <LocalTime iso={game.scheduled_at} />}</span>
      </div>
      {side(away, game.away_score, game.away_team_id)}
      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-mute">@</div>
      {side(home, game.home_score, game.home_team_id)}
      {game.notes ? <p className="pt-1 text-sm text-mute">{game.notes}</p> : null}
    </div>
  );
}

export function MemberRow({ player, accent }: { player: PublicPlayer; accent?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={player.avatar} name={player.display_name} size={52} accent={accent} />
      <div className="min-w-0">
        <div className="truncate text-lg font-extrabold leading-tight">{player.display_name}</div>
        {player.gamertag ? <div className="truncate text-xs font-bold uppercase tracking-widest text-ice">{player.gamertag}</div> : null}
        {player.tagline ? <div className="truncate text-sm italic text-mute">&ldquo;{player.tagline}&rdquo;</div> : null}
      </div>
    </div>
  );
}

export function TeamCard({
  team,
  members,
  record,
  rank,
}: {
  team: Team;
  members: PublicPlayer[];
  record?: { w: number; l: number; pd: number };
  rank?: number;
}) {
  const { primary, secondary } = teamColors(team.nba_team);
  return (
    <Link
      href={`/teams/${team.id}`}
      className="panel group block overflow-hidden p-0 transition hover:-translate-y-1"
    >
      <div
        className="relative flex items-center gap-4 p-5"
        style={{ background: `linear-gradient(115deg, ${primary}cc, ${primary}33 55%, transparent 80%)` }}
      >
        <div className="absolute inset-y-0 right-0 w-24 opacity-30" style={{ background: `repeating-linear-gradient(115deg, ${secondary} 0 6px, transparent 6px 16px)` }} />
        <TeamBadge code={team.nba_team} name={team.name} size={64} />
        <div className="relative min-w-0">
          <div className="truncate font-display text-2xl leading-none group-hover:text-gold">{team.name}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-widest text-white/70">
            {nbaTeam(team.nba_team) ? `${nbaTeam(team.nba_team)!.city} ${nbaTeam(team.nba_team)!.name}` : "No NBA team yet"}
          </div>
          {team.tagline ? <div className="mt-1 truncate text-sm italic text-white/80">&ldquo;{team.tagline}&rdquo;</div> : null}
        </div>
        {rank ? <div className="stat-num outline-text absolute right-4 top-2 text-5xl">#{rank}</div> : null}
      </div>
      <div className="space-y-3 p-5 pt-4">
        {members.length ? (
          members.map((m) => <MemberRow key={m.id} player={m} accent={primary} />)
        ) : (
          <p className="text-sm text-mute">No members yet.</p>
        )}
        {members.length === 1 ? <p className="text-xs uppercase tracking-widest text-mute">Waiting for a teammate</p> : null}
      </div>
      {record ? (
        <div className="flex border-t border-line text-center">
          {[
            ["W", record.w],
            ["L", record.l],
            ["PD", record.pd > 0 ? `+${record.pd}` : record.pd],
          ].map(([k, v]) => (
            <div key={k} className="flex-1 py-2">
              <div className="stat-num text-2xl">{v}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-mute">{k}</div>
            </div>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
