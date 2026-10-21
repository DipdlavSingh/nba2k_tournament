import { createPlayer, deletePlayer, updatePlayer } from "@/app/actions/admin";
import { Avatar } from "@/components/Avatar";
import { SubmitButton } from "@/components/client";
import { Field, Flash, Panel } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { loadTournament } from "@/lib/data";
import type { Team } from "@/lib/types";

function TeamSelect({ teams, value }: { teams: Team[]; value: string | null }) {
  return (
    <select name="team_id" className="input" defaultValue={value ?? ""}>
      <option value="">Free agent</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  );
}

export default async function AdminPlayers({ searchParams }: PageProps<"/admin/players">) {
  await requireAdmin();
  const { ok, err } = (await searchParams) as { ok?: string; err?: string };
  const t = await loadTournament();

  return (
    <div className="space-y-6">
      <Flash ok={ok} err={err} />
      <Panel>
        <h2 className="section-title mb-5 text-2xl">Add a player</h2>
        <form action={createPlayer} className="grid items-end gap-4 md:grid-cols-3">
          <Field label="Username">
            <input name="username" className="input" required pattern="[A-Za-z0-9_]{3,20}" />
          </Field>
          <Field label="Temporary password">
            <input name="password" className="input" required minLength={6} />
          </Field>
          <Field label="Display name">
            <input name="display_name" className="input" maxLength={30} />
          </Field>
          <Field label="Gamertag">
            <input name="gamertag" className="input" maxLength={30} />
          </Field>
          <Field label="Team">
            <TeamSelect teams={t.teams} value={null} />
          </Field>
          <SubmitButton>Add player</SubmitButton>
        </form>
      </Panel>

      <h2 className="section-title text-2xl">All players ({t.players.length})</h2>
      {t.players.map((p) => (
        <details key={p.id} className="panel group p-0">
          <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
            <Avatar src={p.avatar} name={p.display_name} size={44} />
            <div className="min-w-0 flex-1">
              <div className="font-extrabold">{p.display_name} <span className="font-semibold text-mute">@{p.username}</span></div>
              <div className="text-xs font-bold uppercase tracking-widest text-mute">
                {p.team_id ? t.teamById.get(p.team_id)?.name : "Free agent"}
              </div>
            </div>
            <span className="chip group-open:bg-accent group-open:text-white">Edit</span>
          </summary>
          <form action={updatePlayer} className="grid items-end gap-4 border-t border-line p-4 md:grid-cols-3">
            <input type="hidden" name="id" value={p.id} />
            <Field label="Username">
              <input name="username" className="input" defaultValue={p.username} required />
            </Field>
            <Field label="Display name">
              <input name="display_name" className="input" defaultValue={p.display_name} maxLength={30} />
            </Field>
            <Field label="Gamertag">
              <input name="gamertag" className="input" defaultValue={p.gamertag ?? ""} maxLength={30} />
            </Field>
            <Field label="Tagline">
              <input name="tagline" className="input" defaultValue={p.tagline ?? ""} maxLength={80} />
            </Field>
            <Field label="Team">
              <TeamSelect teams={t.teams} value={p.team_id} />
            </Field>
            <Field label="Reset password (blank = keep)">
              <input name="new_password" className="input" minLength={6} />
            </Field>
            <label className="flex items-center gap-3 font-semibold">
              <input type="checkbox" name="clear_avatar" className="h-5 w-5 accent-[#ff2d46]" disabled={!p.avatar} />
              Remove profile picture
            </label>
            <div className="flex gap-3 md:col-span-2 md:justify-end">
              <SubmitButton>Save</SubmitButton>
              <SubmitButton className="btn btn-danger" formAction={deletePlayer} confirm={`Delete ${p.display_name}? This can't be undone.`}>
                Delete
              </SubmitButton>
            </div>
          </form>
        </details>
      ))}
    </div>
  );
}
