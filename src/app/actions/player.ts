"use server";

import bcrypt from "bcryptjs";
import { store, UserError } from "@/lib/store";
import { nbaTeam } from "@/lib/nba";
import { optStr, runAction, str, validAvatar, validPassword } from "@/lib/form";
import { requirePlayer } from "@/lib/session";

export async function updateProfile(fd: FormData) {
  const me = await requirePlayer();
  await runAction("/me", async () => {
    await store.update("players", me.id, {
      display_name: str(fd, "display_name", 30) || me.username,
      gamertag: optStr(fd, "gamertag", 30),
      tagline: optStr(fd, "tagline", 80),
    });
    return "Profile saved.";
  });
}

export async function updateAvatar(fd: FormData) {
  const me = await requirePlayer();
  await runAction("/me", async () => {
    const avatar = str(fd, "avatar", 500_000);
    if (!avatar) throw new UserError("Pick a photo first.");
    await store.update("players", me.id, { avatar: validAvatar(avatar) });
    return "Profile picture updated.";
  });
}

export async function removeAvatar() {
  const me = await requirePlayer();
  await runAction("/me", async () => {
    await store.update("players", me.id, { avatar: null });
    return "Profile picture removed.";
  });
}

export async function changePassword(fd: FormData) {
  const me = await requirePlayer();
  await runAction("/me", async () => {
    const current = String(fd.get("current") ?? "");
    const next = validPassword(String(fd.get("password") ?? ""));
    const full = (await store.list("players")).find((p) => p.id === me.id);
    if (!full || !(await bcrypt.compare(current, full.password_hash))) {
      throw new UserError("Current password is wrong.");
    }
    await store.update("players", me.id, { password_hash: await bcrypt.hash(next, 10) });
    return "Password changed.";
  });
}

export async function updateMyTeam(fd: FormData) {
  const me = await requirePlayer();
  await runAction("/me", async () => {
    if (!me.team_id) throw new UserError("You are not on a team yet.");
    const name = str(fd, "name", 30);
    if (!name) throw new UserError("Team name is required.");
    const code = optStr(fd, "nba_team", 3);
    if (code && !nbaTeam(code)) throw new UserError("Pick a valid NBA team.");
    const teams = await store.list("teams");
    if (code && teams.some((t) => t.nba_team === code && t.id !== me.team_id)) {
      throw new UserError(`${nbaTeam(code)!.name} are already taken by another team.`);
    }
    if (teams.some((t) => t.name.toLowerCase() === name.toLowerCase() && t.id !== me.team_id)) {
      throw new UserError("Another team already uses that name.");
    }
    await store.update("teams", me.team_id, { name, nba_team: code, tagline: optStr(fd, "tagline", 80) });
    return "Team updated.";
  });
}
