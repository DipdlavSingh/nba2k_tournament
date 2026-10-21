import { createTeam, deleteTeam, updateTeam } from "@/app/actions/admin";
import { SubmitButton } from "@/components/client";
import { TeamBadge } from "@/components/TeamBadge";
import { Field, Flash, NbaTeamOptions, Panel } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { loadTournament } from "@/lib/data";
import type { PublicPlayer } from "@/lib/types";

function MemberSelect({ name, players, value }: { name: string; players: PublicPlayer[]; value?: string }) {
  return (
    <select name={name} className="input" defaultValue={value ?? ""}>
      <option value="">— Empty slot —</option>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {p.display_name} (@{p.username})
        </option>
      ))}
    </select>
  );
}

export default async function AdminTeams({ searchParams }: PageProps<"/admin/teams">) {
  await requireAdmin();
  const { ok, err } = (await searchParams) as { ok?: string; err?: string };
  const t = await loadTournament();
  const freeAgents = t.players.filter((p) => !p.team_id);
  const taken = new Set(t.teams.map((x) => x.nba_team).filter((c): c is string => !!c));

  return (
    <div className="space-y-6">
      <Flash ok={ok} err={err} />
      <Panel>
        <h2 className="section-title mb-2 text-2xl">Pair a new team</h2>
        <p className="mb-5 text-sm text-mute">
          {freeAgents.length} free agent(s): {freeAgents.map((p) => p.display_name).join(", ") || "none"}
        </p>
        <form action={createTeam} className="grid items-end gap-4 md:grid-cols-3">
          <Field label="Player 1">
            <MemberSelect name="member1" players={freeAgents} />
          </Field>
          <Field label="Player 2">
            <MemberSelect name="member2" players={freeAgents} />
          </Field>
          <Field label="Team name">
            <input name="name" className="input" required maxLength={30} />
          </Field>
          <Field label="NBA team (players can change it later)">
            <select name="nba_team" className="input" defaultValue="">
              <NbaTeamOptions taken={taken} current={null} />
            </select>
          </Field>
          <Field label="Team tagline">
            <input name="tagline" className="input" maxLength={80} />
          </Field>
          <SubmitButton>Create team</SubmitButton>
        </form>
      </Panel>

      <h2 className="section-title text-2xl">All teams ({t.teams.length})</h2>
      {t.teams.map((team) => {
        const members = t.membersOf(team.id);
        const options = [...members, ...freeAgents];
        return (
          <details key={team.id} className="panel group p-0">
            <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
              <TeamBadge code={team.nba_team} name={team.name} size={40} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-xl">{team.name}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-mute">
                  {members.map((m) => m.display_name).join(" & ") || "No members"}
                  {members.length < 2 ? " · needs a player" : ""}
                </div>
              </div>
              <span className="chip group-open:bg-accent group-open:text-white">Edit</span>
            </summary>
            <form action={updateTeam} className="grid items-end gap-4 border-t border-line p-4 md:grid-cols-3">
              <input type="hidden" name="id" value={team.id} />
              <Field label="Team name">
                <input name="name" className="input" defaultValue={team.name} required maxLength={30} />
              </Field>
              <Field label="NBA team">
                <select name="nba_team" className="input" defaultValue={team.nba_team ?? ""}>
                  <NbaTeamOptions taken={taken} current={team.nba_team} />
                </select>
              </Field>
              <Field label="Team tagline">
                <input name="tagline" className="input" defaultValue={team.tagline ?? ""} maxLength={80} />
              </Field>
              <Field label="Player 1">
                <MemberSelect name="member1" players={options} value={members[0]?.id} />
              </Field>
              <Field label="Player 2">
                <MemberSelect name="member2" players={options} value={members[1]?.id} />
              </Field>
              <div className="flex gap-3 md:justify-end">
                <SubmitButton>Save</SubmitButton>
                <SubmitButton
                  className="btn btn-danger"
                  formAction={deleteTeam}
                  confirm={`Delete ${team.name}? Its games are removed and its players become free agents.`}
                >
                  Delete
                </SubmitButton>
              </div>
            </form>
          </details>
        );
      })}
    </div>
  );
}
