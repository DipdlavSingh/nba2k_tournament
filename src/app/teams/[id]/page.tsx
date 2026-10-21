import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TeamBadge } from "@/components/TeamBadge";
import { GameCard, MemberRow, Panel } from "@/components/ui";
import { gamesForTeam, loadTournament, sortGames } from "@/lib/data";
import { nbaTeam, teamColors } from "@/lib/nba";

export async function generateMetadata({ params }: PageProps<"/teams/[id]">): Promise<Metadata> {
  const { id } = await params;
  const t = await loadTournament();
  return { title: t.teamById.get(id)?.name ?? "Team" };
}

export default async function TeamPage({ params }: PageProps<"/teams/[id]">) {
  const { id } = await params;
  const t = await loadTournament();
  const team = t.teamById.get(id);
  if (!team) notFound();
  const row = t.standings.find((r) => r.team.id === id)!;
  const members = t.membersOf(id);
  const games = sortGames(gamesForTeam(t.games, id));
  const { primary, secondary } = teamColors(team.nba_team);
  const nba = nbaTeam(team.nba_team);

  return (
    <div className="space-y-8">
      <section className="panel rise overflow-hidden p-0">
        <div
          className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-10"
          style={{ background: `linear-gradient(115deg, ${primary}, ${primary}55 55%, transparent 85%)` }}
        >
          <div
            className="absolute inset-y-0 right-0 w-1/3 opacity-25"
            style={{ background: `repeating-linear-gradient(115deg, ${secondary} 0 10px, transparent 10px 26px)` }}
          />
          <TeamBadge code={team.nba_team} name={team.name} size={130} />
          <div className="relative">
            <div className="text-sm font-bold uppercase tracking-widest text-white/75">
              {nba ? `${nba.city} ${nba.name}` : "No NBA team picked"}
            </div>
            <h1 className="font-display text-6xl leading-none sm:text-7xl">{team.name}</h1>
            {team.tagline ? <p className="mt-2 text-lg italic text-white/85">&ldquo;{team.tagline}&rdquo;</p> : null}
          </div>
          <div className="relative grid grid-cols-4 gap-4 sm:ml-auto">
            {[
              ["Rank", `#${row.rank}`],
              ["Record", `${row.w}-${row.l}`],
              ["Diff", row.pd > 0 ? `+${row.pd}` : row.pd],
              ["PF", row.pf],
            ].map(([k, v]) => (
              <div key={k} className="text-center">
                <div className="stat-num text-4xl">{v}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <h2 className="section-title">Roster</h2>
          <Panel className="space-y-5">
            {members.length ? members.map((m) => <MemberRow key={m.id} player={m} accent={primary} />) : <p className="text-mute">No members.</p>}
          </Panel>
        </div>
        <div className="space-y-4">
          <h2 className="section-title">Games</h2>
          {games.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {games.map((g) => <GameCard key={g.id} game={g} teamById={t.teamById} highlight={id} />)}
            </div>
          ) : (
            <p className="text-mute">No games scheduled yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
