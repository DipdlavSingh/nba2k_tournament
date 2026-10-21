"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { store, UserError } from "@/lib/store";
import { getSettings } from "@/lib/data";
import { optStr, runAction, str, validPassword, validUsername } from "@/lib/form";
import { checkAdminCredentials, endSession, startSession } from "@/lib/session";

function password(fd: FormData, key = "password") {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export async function signup(fd: FormData) {
  await runAction(
    "/signup",
    async () => {
      const settings = await getSettings();
      if (!settings.registration_open) throw new UserError("Registration is closed. Ask the admin to add you.");
      const username = validUsername(str(fd, "username"));
      const pw = validPassword(password(fd));
      if (pw !== password(fd, "confirm")) throw new UserError("Passwords do not match.");
      const players = await store.list("players");
      if (players.some((p) => p.username === username)) throw new UserError("That username is taken.");
      const id = crypto.randomUUID();
      await store.insert("players", {
        id,
        username,
        password_hash: await bcrypt.hash(pw, 10),
        display_name: str(fd, "display_name", 30) || username,
        gamertag: optStr(fd, "gamertag", 30),
        tagline: optStr(fd, "tagline", 80),
        avatar: null,
        team_id: null,
        created_at: new Date().toISOString(),
      });
      await startSession({ sub: id, role: "player" });
      return "Welcome! Upload a photo while the admin pairs you with a teammate.";
    },
    "/me",
  );
}

export async function login(fd: FormData) {
  await runAction(
    "/login",
    async () => {
      const username = str(fd, "username").toLowerCase();
      const player = (await store.list("players")).find((p) => p.username === username);
      if (!player || !(await bcrypt.compare(password(fd), player.password_hash))) {
        throw new UserError("Wrong username or password.");
      }
      await startSession({ sub: player.id, role: "player" });
    },
    "/me",
  );
}

export async function adminLogin(fd: FormData) {
  await runAction(
    "/admin/login",
    async () => {
      if (!checkAdminCredentials(str(fd, "username"), password(fd))) {
        throw new UserError("Wrong admin credentials.");
      }
      await startSession({ sub: "admin", role: "admin" });
    },
    "/admin",
  );
}

export async function logout() {
  await endSession();
  redirect("/");
}
