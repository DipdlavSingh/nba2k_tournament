import { addGame, createFinals, deleteGame, generateSchedule, updateGame } from "@/app/actions/admin";
import Link from "next/link";
import { BannerPicker, DateTimeInput, SubmitButton } from "@/components/client";
import { Field, Flash, Panel } from "@/components/ui";
import { loadTournament, sortGames } from "@/lib/data";
import { requireAdmin } from "@/lib/session";
import { bannerSrc, bannerState, type BannerState } from "@/lib/banners";
import type { Game, Team } from "@/lib/types";

const BANNER_CHIP: Record<BannerState, [string, string] | null> = {
  none: null,
  off: ["Banner off", ""],
  active: ["Banner live", "bg-win/20 text-win"],
  expired: ["Banner expired", "bg-accent/20 text-[#ff8090]"],
};

const FILTERS = [
  ["", "All games"],
  ["active", "Live banners"],
  ["any", "Any banner"],
] as const;

function TeamOptions({ teams }: { teams: Team[] }) {
  return teams.map((t) => (
    <option key={t.id} value={t.id}>{t.name}</option>
  ));
}

function GameEditor({ game, teams, filter }: { game: Game; teams: Team[]; filter: string }) {
  return (
    <form
      action={updateGame}
      className={`grid items-end gap-3 border-t border-line px-4 py-4 md:grid-cols-[repeat(14,minmax(0,1fr))] ${game.status === "final" ? "bg-win/[0.03]" : ""}`}
    >
      <input type="hidden" name="id" value={game.id} />
      <input type="hidden" name="filter" value={filter} />
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
      <div className="md:col-span-14">
        <Field label="Notes (optional, shown publicly)">
          <input name="notes" className="input" defaultValue={game.notes ?? ""} maxLength={140} placeholder="e.g. Forfeit, OT thriller" />
        </Field>
      </div>
      <details className="group md:col-span-14" open={bannerState(game) !== "none"}>
        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-bold uppercase tracking-widest text-mute">
          <span className="group-open:rotate-90 transition">▸</span> Home page banner
          {BANNER_CHIP[bannerState(game)] ? (
            <span className={`chip ${BANNER_CHIP[bannerState(game)]![1]}`}>{BANNER_CHIP[bannerState(game)]![0]}</span>
          ) : null}
        </summary>
        <div className="mt-3 grid gap-4 md:grid-cols-[2fr_1fr]">
          <BannerPicker current={game.banner_version ? bannerSrc(game) : null} name="banner_image" />
          <div className="space-y-3">
            <label className="flex items-center gap-3 font-semibold">
              <input type="checkbox" name="banner_active" defaultChecked={game.banner_active} className="h-5 w-5 accent-[#ff2d46]" />
              Banner (show on home page)
            </label>
            <Field label="Show until (optional)">
              <DateTimeInput name="banner_until" defaultValue={game.banner_until} />
            </Field>
            {game.banner_version ? (
              <label className="flex items-center gap-3 text-sm font-semibold text-[#ff8090]">
                <input type="checkbox" name="banner_remove" className="h-4 w-4 accent-[#ff2d46]" />
                Delete banner image
              </label>
            ) : null}
            <p className="text-xs text-mute">Shown at a 3:1 shape. About 1500×500 px works best. Click Save to apply.</p>
          </div>
        </div>
      </details>
      <div className="flex gap-2 md:col-span-14 md:justify-end">
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
  const { ok, err, banner } = (await searchParams) as { ok?: string; err?: string; banner?: string };
  const t = await loadTournament();
  const filter = banner === "active" || banner === "any" ? banner : "";
  const shown = (g: Game) =>
    filter === "active" ? bannerState(g) === "active" : filter === "any" ? bannerState(g) !== "none" : true;
  const counts = {
    "": t.games.length,
    active: t.games.filter((g) => bannerState(g) === "active").length,
    any: t.games.filter((g) => bannerState(g) !== "none").length,
  };
  const rounds = new Map<number, Game[]>();
  for (const g of sortGames(t.rrGames).filter(shown)) rounds.set(g.round, [...(rounds.get(g.round) ?? []), g]);
  const seeds = t.finalsSeeds();
  const finalsGames = (t.finals?.games ?? []).filter(shown);

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title text-2xl">Enter scores & banners</h2>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(([value, label]) => (
            <Link
              key={value}
              href={value ? `/admin/games?banner=${value}` : "/admin/games"}
              className={`btn btn-sm ${filter === value ? "btn-primary" : "btn-ghost"}`}
            >
              {label} ({counts[value]})
            </Link>
          ))}
        </div>
      </div>
      {!t.games.length ? <p className="text-mute">No games yet.</p> : null}
      {t.games.length && !rounds.size && !finalsGames.length ? (
        <p className="text-mute">{filter === "active" ? "No banners are live right now." : "No games have a banner image yet."}</p>
      ) : null}
      {[...rounds].map(([round, games]) => (
        <div key={round} className="panel p-0">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-display text-xl">Round {round}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-mute">
              {games.filter((g) => g.status === "final").length}/{games.length} final
            </span>
          </div>
          {games.map((g) => <GameEditor key={g.id} game={g} teams={t.teams} filter={filter} />)}
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
          {finalsGames.map((g) => <GameEditor key={g.id} game={g} teams={t.teams} filter={filter} />)}
        </div>
      ) : null}
    </div>
  );
}
