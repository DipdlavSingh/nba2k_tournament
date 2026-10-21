import Link from "next/link";
import { saveSettings } from "@/app/actions/admin";
import { SubmitButton } from "@/components/client";
import { Field, Flash, Panel } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { loadTournament } from "@/lib/data";

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { ok, err } = (await searchParams) as { ok?: string; err?: string };
  const t = await loadTournament();
  const s = t.settings;
  const freeAgents = t.players.filter((p) => !p.team_id);
  const incomplete = t.teams.filter((team) => t.membersOf(team.id).length < 2);
  const played = t.rrGames.filter((g) => g.status === "final").length;
  const [seed1, seed2] = s.finals_override ?? ["", ""];

  const todo: [string, string, string][] = [];
  if (freeAgents.length) todo.push([`${freeAgents.length} player(s) without a team`, "/admin/teams", "Pair them"]);
  if (incomplete.length) todo.push([`${incomplete.length} team(s) with fewer than 2 members`, "/admin/teams", "Fix teams"]);
  if (t.teams.length >= 2 && !t.rrGames.length) todo.push(["No round robin schedule yet", "/admin/games", "Generate"]);
  if (t.rrComplete && !t.finals) todo.push(["Round robin finished: set up the Finals", "/admin/games", "Create Finals"]);

  return (
    <div className="space-y-6">
      <Flash ok={ok} err={err} />
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Players", t.players.length],
          ["Teams", t.teams.length],
          ["RR games final", `${played}/${t.rrGames.length}`],
          ["Phase", t.phase.replace("-", " ")],
        ].map(([k, v]) => (
          <Panel key={k}>
            <div className="stat-num text-4xl capitalize">{v}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-mute">{k}</div>
          </Panel>
        ))}
      </div>

      {todo.length ? (
        <Panel className="space-y-3">
          <h2 className="section-title text-2xl">To do</h2>
          {todo.map(([text, href, cta]) => (
            <div key={text} className="flex items-center justify-between gap-4">
              <span className="font-semibold">{text}</span>
              <Link href={href} className="btn btn-primary btn-sm">{cta}</Link>
            </div>
          ))}
        </Panel>
      ) : null}

      <Panel>
        <h2 className="section-title mb-5 text-2xl">Tournament settings</h2>
        <form action={saveSettings} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tournament name">
              <input name="name" className="input" defaultValue={s.name} maxLength={60} required />
            </Field>
            <Field label="Season label">
              <input name="season" className="input" defaultValue={s.season} maxLength={40} />
            </Field>
          </div>
          <Field label="Announcement banner (shown on the home page, blank to hide)">
            <textarea name="announcement" className="input min-h-20" defaultValue={s.announcement} maxLength={280} />
          </Field>
          <label className="flex items-center gap-3 font-semibold">
            <input type="checkbox" name="registration_open" defaultChecked={s.registration_open} className="h-5 w-5 accent-[#ff2d46]" />
            Registration open (players can sign up)
          </label>
          <div className="border-t border-line pt-4">
            <span className="field-label">Finals seeding override</span>
            <p className="mb-3 text-sm text-mute">
              Leave on Auto to take the top 2 from the leaderboard. Override only if you need to settle something manually
              (for example a tie nobody can break). Applies when you create the Finals.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["seed1", "Seed 1", seed1],
                ["seed2", "Seed 2", seed2],
              ].map(([name, label, value]) => (
                <Field key={name} label={label}>
                  <select name={name} className="input" defaultValue={value}>
                    <option value="">Auto</option>
                    {t.teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
          </div>
          <SubmitButton>Save settings</SubmitButton>
        </form>
      </Panel>
    </div>
  );
}
