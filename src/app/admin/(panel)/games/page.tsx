import { addGame, createFinals, deleteGame, generateSchedule, updateGame } from "@/app/actions/admin";
import { DateTimeInput, SubmitButton } from "@/components/client";
import { Field, Flash, Panel } from "@/components/ui";
import { loadTournament, sortGames } from "@/lib/data";
import { requireAdmin } from "@/lib/session";
import type { Game, Team } from "@/lib/types";

function TeamOptions({ teams }: { teams: Team[] }) {
  return teams.map((t) => (
    <option key={t.id} value={t.id}>{t.name}</option>
  ));
}

function GameEditor({ game, teams }: { game: Game; teams: Team[] }) {
  return (
    <form
      action={updateGame}
      className={`grid items-end gap-3 border-t border-line px-4 py-4 md:grid-cols-[repeat(14,minmax(0,1fr))] ${game.status === "final" ? "bg-win/[0.03]" : ""}`}
    >
      <input type="hidden" name="id" value={game.id} />
      <div className="md:col-span-1">
        <Field label={game.stage === "final" ? "Game" : "Round"}>
          <input name="round" type="number" min={1} className="input" defaultValue={game.round} />
        </Field>
      </div>
      <div className="md:col-span-3">
        <Field label="Away">
          <select name="away_team_id" className="input" defaultValue={game.away_team_id}>
            <TeamOptions teams={teams} />
          </select>
        </Field>
      </div>
      <div className="md:col-span-1">
        <Field label="Pts">
          <input name="away_score" type="number" min={0} className="input text-center" defaultValue={game.away_score ?? ""} />
        </Field>
      </div>
      <div className="md:col-span-3">
        <Field label="Home">
          <select name="home_team_id" className="input" defaultValue={game.home_team_id}>
            <TeamOptions teams={teams} />
          </select>
        </Field>
      </div>
      <div className="md:col-span-1">
        <Field label="Pts">
          <input name="home_score" type="number" min={0} className="input text-center" defaultValue={game.home_score ?? ""} />
        </Field>
      </div>
      <div className="md:col-span-3">
        <Field label="Tip-off (your time)">
          <DateTimeInput name="scheduled_at" defaultValue={game.scheduled_at} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Status">
          <select name="status" className="input" defaultValue={game.status}>
            <option value="scheduled">Scheduled</option>
            <option value="final">Final</option>
          </select>
        </Field>
      </div>
      <div className="md:col-span-8">
        <Field label="Notes (optional, shown publicly)">
          <input name="notes" className="input" defaultValue={game.notes ?? ""} maxLength={140} placeholder="e.g. Forfeit, OT thriller" />
        </Field>
      </div>
      <div className="flex gap-2 md:col-span-6 md:justify-end">
        <SubmitButton className="btn btn-primary btn-sm">Save</SubmitButton>
        <SubmitButton className="btn btn-danger btn-sm" formAction={deleteGame} confirm="Delete this game?">
          Delete
        </SubmitButton>
      </div>
    </form>
  );
}

export default async function AdminGames({ searchParams }: PageProps<"/admin/games">) {
  await requireAdmin();
  const { ok, err } = (await searchParams) as { ok?: string; err?: string };
  const t = await loadTournament();
  const rounds = new Map<number, Game[]>();
  for (const g of sortGames(t.rrGames)) rounds.set(g.round, [...(rounds.get(g.round) ?? []), g]);
  const seeds = t.finalsSeeds();
  const finalsGames = t.finals?.games ?? [];

  return (
    <div className="space-y-6">
      <Flash ok={ok} err={err} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="section-title mb-2 text-2xl">Round robin</h2>
          <p className="mb-4 text-sm text-mute">
            Builds a schedule where every team plays every other team once ({t.teams.length} teams →{" "}
            {(t.teams.length * (t.teams.length - 1)) / 2} games). You can edit any game afterwards.
          </p>
          <form action={generateSchedule} className="grid items-end gap-4 sm:grid-cols-2">
            <Field label="Round 1 tip-off (optional)">
              <DateTimeInput name="start" />
            </Field>
            <Field label="Days between rounds">
              <input name="days_between" type="number" min={0} defaultValue={7} className="input" />
            </Field>
            <label className="flex items-center gap-3 font-semibold">
              <input type="checkbox" name="replace" className="h-5 w-5 accent-[#ff2d46]" />
              Replace existing (deletes RR scores)
            </label>
            <SubmitButton>Generate schedule</SubmitButton>
          </form>
        </Panel>

        <Panel>
          <h2 className="section-title mb-2 text-2xl">Finals · Best of 3</h2>
          <p className="mb-4 text-sm text-mute">
            {seeds
              ? `Will seed ${t.teamById.get(seeds[0])?.name} (1) vs ${t.teamById.get(seeds[1])?.name} (2)${t.settings.finals_override ? " — manual override from Overview" : " from the leaderboard"}.`
              : "Needs at least 2 teams."}{" "}
            {!t.rrComplete && t.rrGames.length ? "Round robin isn't finished yet." : ""} Seed 1 hosts games 1 and 3.
          </p>
          <form action={createFinals} className="grid items-end gap-4 sm:grid-cols-2">
            <Field label="Game 1 tip-off (optional, games 1 hour apart)">
              <DateTimeInput name="start" />
            </Field>
            <label className="flex items-center gap-3 font-semibold">
              <input type="checkbox" name="replace" className="h-5 w-5 accent-[#ff2d46]" />
              Replace existing Finals
            </label>
            <SubmitButton className="btn btn-gold">Create Finals</SubmitButton>
          </form>
        </Panel>
      </div>

      <Panel>
        <h2 className="section-title mb-4 text-2xl">Add a single game</h2>
        <form action={addGame} className="grid items-end gap-4 md:grid-cols-6">
          <Field label="Stage">
            <select name="stage" className="input">
              <option value="rr">Round robin</option>
              <option value="final">Finals</option>
            </select>
          </Field>
          <Field label="Round / game #">
            <input name="round" type="number" min={1} defaultValue={1} className="input" />
          </Field>
          <Field label="Away">
            <select name="away_team_id" className="input"><TeamOptions teams={t.teams} /></select>
          </Field>
          <Field label="Home">
            <select name="home_team_id" className="input"><TeamOptions teams={t.teams} /></select>
          </Field>
          <Field label="Tip-off">
            <DateTimeInput name="scheduled_at" />
          </Field>
          <SubmitButton>Add game</SubmitButton>
        </form>
      </Panel>

      <h2 className="section-title text-2xl">Enter scores</h2>
      {!t.games.length ? <p className="text-mute">No games yet.</p> : null}
      {[...rounds].map(([round, games]) => (
        <div key={round} className="panel p-0">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-display text-xl">Round {round}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-mute">
              {games.filter((g) => g.status === "final").length}/{games.length} final
            </span>
          </div>
          {games.map((g) => <GameEditor key={g.id} game={g} teams={t.teams} />)}
        </div>
      ))}
      {finalsGames.length ? (
        <div className="panel p-0">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-display text-xl text-gold">Finals</span>
            {t.finals?.champion ? (
              <span className="chip bg-gold text-black">Champion: {t.teamById.get(t.finals.champion)?.name}</span>
            ) : null}
          </div>
          {finalsGames.map((g) => <GameEditor key={g.id} game={g} teams={t.teams} />)}
        </div>
      ) : null}
    </div>
  );
}
