import type { Metadata } from "next";
import { GameCard } from "@/components/ui";
import { loadTournament, sortGames } from "@/lib/data";

export const metadata: Metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const t = await loadTournament();
  const rounds = new Map<number, typeof t.games>();
  for (const g of sortGames(t.rrGames)) rounds.set(g.round, [...(rounds.get(g.round) ?? []), g]);

  return (
    <div className="space-y-10">
      <h1 className="font-display text-6xl">Schedule</h1>
      {!t.games.length ? <p className="text-mute">The admin hasn&apos;t posted the schedule yet.</p> : null}
      {[...rounds].map(([round, games]) => (
        <section key={round} className="space-y-4">
          <h2 className="section-title">
            Round {round}
            <span className="font-body text-sm not-italic tracking-widest text-mute">
              {games.filter((g) => g.status === "final").length}/{games.length} final
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => <GameCard key={g.id} game={g} teamById={t.teamById} />)}
          </div>
        </section>
      ))}
      {t.finals ? (
        <section className="space-y-4">
          <h2 className="section-title">Finals · Best of 3</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.finals.games.map((g) => <GameCard key={g.id} game={g} teamById={t.teamById} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
