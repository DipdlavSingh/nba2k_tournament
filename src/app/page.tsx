import Link from "next/link";
import { BannerCarousel } from "@/components/BannerCarousel";
import { HeroArt } from "@/components/HeroArt";
import { Leaderboard } from "@/components/Leaderboard";
import { TeamBadge } from "@/components/TeamBadge";
import { GameCard, Panel, TeamCard } from "@/components/ui";
import { loadTournament, sortGames } from "@/lib/data";
import { isPlayed } from "@/lib/standings";
import { bannerSrc, bannerState } from "@/lib/banners";
import type { Team } from "@/lib/types";

const PHASE_LABEL = {
  registration: "Registration open",
  "round-robin": "Round robin live",
  finals: "Finals underway",
  complete: "Champions crowned",
} as const;

export default async function Home() {
  const t = await loadTournament();
  const played = t.rrGames.filter(isPlayed).length;
  const seeds = t.finals ? [t.finals.seed1, t.finals.seed2] : t.rrComplete ? (t.finalsSeeds() ?? []) : [];
  const upcoming = sortGames(t.games.filter((g) => g.status !== "final")).slice(0, 4);
  const recent = sortGames(t.games.filter(isPlayed)).reverse().slice(0, 4);
  const champion = t.finals?.champion ? t.teamById.get(t.finals.champion) : undefined;
  const recordOf = new Map(t.standings.map((r) => [r.team.id, r]));
  const banners = sortGames(t.games.filter((g) => bannerState(g) === "active")).map((g) => ({
    id: g.id,
    src: bannerSrc(g),
    alt: `${t.teamById.get(g.away_team_id)?.name ?? "TBD"} vs ${t.teamById.get(g.home_team_id)?.name ?? "TBD"}`,
  }));

  return (
    <div className="space-y-12">
      {banners.length ? <BannerCarousel slides={banners} /> : null}

      {/* HERO */}
      <section className="panel rise relative overflow-hidden p-0">
        <div className="grid items-center gap-6 md:grid-cols-[1.15fr_1fr]">
          <div className="relative z-10 p-6 sm:p-10">
            <div className="flex flex-wrap gap-2">
              <span className="chip bg-accent text-white">NBA 2K26</span>
              <span className="chip">2v2 Duos</span>
              <span className="chip">{t.settings.season}</span>
            </div>
            <h1 className="glow-text mt-5 font-display text-[clamp(3rem,8vw,6.5rem)] leading-[0.88]">
              {t.settings.name}
            </h1>
            <p className="mt-4 max-w-md text-lg font-semibold text-white/75">
              Round robin. Every duo plays every duo. The top two run it back in a best-of-3 Final.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {t.settings.registration_open ? (
                <Link href="/signup" className="btn btn-primary">Join the tournament</Link>
              ) : null}
              <Link href="/schedule" className="btn btn-ghost">View schedule</Link>
            </div>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-4">
              {[
                ["Teams", t.teams.length],
                ["Games played", `${played}/${t.rrGames.length}`],
                ["Status", PHASE_LABEL[t.phase]],
              ].map(([k, v]) => (
                <div key={k} className="border-l-2 border-accent pl-3">
                  <div className={`stat-num ${String(v).length > 8 ? "text-lg" : "text-3xl"}`}>{v}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-mute">{k}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative -mt-10 h-72 md:mt-0 md:h-[460px]">
            <div className="outline-text absolute right-4 top-2 font-display text-[9rem] leading-none md:text-[13rem]">26</div>
            <HeroArt />
          </div>
        </div>
      </section>

      {t.settings.announcement ? (
        <div className="panel flex items-center gap-4 px-5 py-4">
          <span className="chip bg-gold text-black">Update</span>
          <p className="font-semibold">{t.settings.announcement}</p>
        </div>
      ) : null}

      {champion ? (
        <section className="panel rise relative overflow-hidden p-8 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,198,41,0.35),transparent_60%)]" />
          <div className="relative flex flex-col items-center gap-3">
            <span className="chip bg-gold text-black">Champions</span>
            <TeamBadge code={champion.nba_team} name={champion.name} size={110} />
            <h2 className="font-display text-5xl text-gold">{champion.name}</h2>
            <p className="font-semibold text-white/80">
              {t.membersOf(champion.id).map((m) => m.display_name).join(" & ")} won the Finals{" "}
              {t.finals!.wins[champion.id]}–{t.finals!.wins[champion.id === t.finals!.seed1 ? t.finals!.seed2 : t.finals!.seed1]}
            </p>
          </div>
        </section>
      ) : null}

      {/* STANDINGS */}
      <section id="standings" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="section-title">Leaderboard</h2>
          <span className="text-xs font-bold uppercase tracking-widest text-mute">Round robin standings</span>
        </div>
        <Panel>
          <Leaderboard rows={t.standings} finalists={seeds} />
        </Panel>
      </section>

      {/* FINALS */}
      {t.finals ? (
        <section className="space-y-4">
          <h2 className="section-title">The Finals · Best of 3</h2>
          <Panel>
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
              <FinalsSeed team={t.teamById.get(t.finals.seed1)} seed={1} />
              <div className="stat-num text-center text-6xl">
                <span className="text-gold">{t.finals.wins[t.finals.seed1]}</span>
                <span className="mx-3 text-mute">–</span>
                <span className="text-gold">{t.finals.wins[t.finals.seed2]}</span>
              </div>
              <FinalsSeed team={t.teamById.get(t.finals.seed2)} seed={2} />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {t.finals.games.map((g) => {
                const notNeeded = t.finals!.champion && g.status !== "final";
                return (
                  <div key={g.id} className={notNeeded ? "opacity-40" : ""}>
                    <GameCard game={g} teamById={t.teamById} />
                    {g.round === 3 && !notNeeded && g.status !== "final" ? (
                      <p className="mt-1 text-center text-xs uppercase tracking-widest text-mute">If necessary</p>
                    ) : null}
                    {notNeeded ? <p className="mt-1 text-center text-xs uppercase tracking-widest text-mute">Not needed</p> : null}
                  </div>
                );
              })}
            </div>
          </Panel>
        </section>
      ) : null}

      {/* GAMES */}
      {upcoming.length || recent.length ? (
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="section-title">Up next</h2>
            {upcoming.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((g) => <GameCard key={g.id} game={g} teamById={t.teamById} />)}
              </div>
            ) : (
              <p className="text-mute">No games left on the schedule.</p>
            )}
          </div>
          <div className="space-y-4">
            <h2 className="section-title">Latest results</h2>
            {recent.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {recent.map((g) => <GameCard key={g.id} game={g} teamById={t.teamById} />)}
              </div>
            ) : (
              <p className="text-mute">No results yet. Tip-off soon.</p>
            )}
          </div>
        </section>
      ) : null}

      {/* TEAMS */}
      <section id="teams" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="section-title">The Duos</h2>
          <span className="text-xs font-bold uppercase tracking-widest text-mute">
            {t.teams.length} teams · {t.players.filter((p) => !p.team_id).length} free agents
          </span>
        </div>
        {t.teams.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.standings.map((r) => (
              <TeamCard
                key={r.team.id}
                team={r.team}
                members={t.membersOf(r.team.id)}
                record={recordOf.get(r.team.id)}
                rank={r.gp ? r.rank : undefined}
              />
            ))}
          </div>
        ) : (
          <Panel>
            <p className="text-mute">Teams appear here once the admin pairs up players.</p>
          </Panel>
        )}
      </section>
    </div>
  );
}

function FinalsSeed({ team, seed }: { team: Team | undefined; seed: 1 | 2 }) {
  return (
    <div className={`flex items-center gap-4 ${seed === 2 ? "md:flex-row-reverse md:text-right" : ""}`}>
      <TeamBadge code={team?.nba_team ?? null} name={team?.name ?? "?"} size={72} />
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-mute">Seed {seed}</div>
        <div className="font-display text-3xl">{team?.name ?? "Deleted team"}</div>
      </div>
    </div>
  );
}
