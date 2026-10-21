import type { Metadata } from "next";
import { changePassword, removeAvatar, updateAvatar, updateMyTeam, updateProfile } from "@/app/actions/player";
import { AvatarPicker, SubmitButton } from "@/components/client";
import { TeamBadge } from "@/components/TeamBadge";
import { Field, Flash, GameCard, MemberRow, NbaTeamOptions, Panel } from "@/components/ui";
import { gamesForTeam, loadTournament, sortGames } from "@/lib/data";
import { teamColors } from "@/lib/nba";
import { requirePlayer } from "@/lib/session";
import { winnerOf } from "@/lib/standings";

export const metadata: Metadata = { title: "My locker room" };

export default async function MePage({ searchParams }: PageProps<"/me">) {
  const { ok, err } = (await searchParams) as { ok?: string; err?: string };
  const me = await requirePlayer();
  const t = await loadTournament();
  const team = me.team_id ? t.teamById.get(me.team_id) : undefined;
  const row = team ? t.standings.find((r) => r.team.id === team.id) : undefined;
  const teammate = team ? t.membersOf(team.id).find((p) => p.id !== me.id) : undefined;
  const games = team ? sortGames(gamesForTeam(t.games, team.id)) : [];
  const taken = new Set(t.teams.map((x) => x.nba_team).filter((c): c is string => !!c));
  const { primary } = teamColors(team?.nba_team);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip bg-accent text-white">My locker room</span>
          <h1 className="mt-2 font-display text-6xl leading-none">{me.display_name}</h1>
          <p className="text-mute">@{me.username}</p>
        </div>
        {row ? (
          <div className="flex gap-6">
            {[
              ["Rank", `#${row.rank}`],
              ["Record", `${row.w}-${row.l}`],
              ["Diff", row.pd > 0 ? `+${row.pd}` : row.pd],
              ["Left", row.remaining],
            ].map(([k, v]) => (
              <div key={k} className="text-center">
                <div className="stat-num text-4xl">{v}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-mute">{k}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Flash ok={ok} err={err} />

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="section-title">Player card</h2>
          <Panel className="space-y-6">
            <form action={updateAvatar}>
              <span className="field-label">Profile picture</span>
              <AvatarPicker current={me.avatar} name="avatar" />
            </form>
            {me.avatar ? (
              <form action={removeAvatar}>
                <SubmitButton className="btn btn-danger btn-sm">Remove photo</SubmitButton>
              </form>
            ) : null}
            <form action={updateProfile} className="space-y-4 border-t border-line pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name">
                  <input name="display_name" className="input" defaultValue={me.display_name} maxLength={30} />
                </Field>
                <Field label="Gamertag">
                  <input name="gamertag" className="input" defaultValue={me.gamertag ?? ""} maxLength={30} />
                </Field>
              </div>
              <Field label="Tagline">
                <input name="tagline" className="input" defaultValue={me.tagline ?? ""} maxLength={80} placeholder="Cash from deep." />
              </Field>
              <SubmitButton>Save profile</SubmitButton>
            </form>
          </Panel>
        </section>

        <section className="space-y-4">
          <h2 className="section-title">My team</h2>
          {team ? (
            <Panel className="space-y-6">
              <div className="flex items-center gap-4">
                <TeamBadge code={team.nba_team} name={team.name} size={72} />
                <div>
                  <div className="font-display text-3xl leading-none">{team.name}</div>
                  {team.tagline ? <div className="italic text-mute">&ldquo;{team.tagline}&rdquo;</div> : null}
                </div>
              </div>
              <div>
                <span className="field-label">Teammate</span>
                {teammate ? <MemberRow player={teammate} accent={primary} /> : <p className="text-mute">The admin hasn&apos;t added your teammate yet.</p>}
              </div>
              <form action={updateMyTeam} className="space-y-4 border-t border-line pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Team name">
                    <input name="name" className="input" defaultValue={team.name} maxLength={30} required />
                  </Field>
                  <Field label="NBA team">
                    <select name="nba_team" className="input" defaultValue={team.nba_team ?? ""}>
                      <NbaTeamOptions taken={taken} current={team.nba_team} />
                    </select>
                  </Field>
                </div>
                <Field label="Team tagline">
                  <input name="tagline" className="input" defaultValue={team.tagline ?? ""} maxLength={80} />
                </Field>
                <SubmitButton>Save team</SubmitButton>
              </form>
            </Panel>
          ) : (
            <Panel>
              <p className="font-semibold">You&apos;re a free agent for now.</p>
              <p className="mt-1 text-mute">
                The admin will pair you with a teammate. After that you can set your team name, NBA team and tagline here.
              </p>
            </Panel>
          )}
        </section>
      </div>

      {team ? (
        <section className="space-y-4">
          <h2 className="section-title">My games & scores</h2>
          {games.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((g) => {
                const w = winnerOf(g);
                return (
                  <div key={g.id}>
                    <GameCard game={g} teamById={t.teamById} highlight={team.id} />
                    {w ? (
                      <div className="mt-1 text-right">
                        <span className={`chip ${w === team.id ? "bg-win/20 text-win" : "bg-accent/20 text-[#ff8090]"}`}>
                          {w === team.id ? "Win" : "Loss"}
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-mute">No games scheduled yet.</p>
          )}
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="section-title">Password</h2>
        <Panel>
          <form action={changePassword} className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <Field label="Current password">
              <input name="current" type="password" className="input" autoComplete="current-password" required />
            </Field>
            <Field label="New password">
              <input name="password" type="password" className="input" autoComplete="new-password" minLength={6} required />
            </Field>
            <SubmitButton className="btn btn-ghost">Change</SubmitButton>
          </form>
        </Panel>
      </section>
    </div>
  );
}
