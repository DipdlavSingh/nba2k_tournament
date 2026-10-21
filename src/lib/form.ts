import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { UserError } from "./store";

export function str(fd: FormData, key: string, max = 200): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function optStr(fd: FormData, key: string, max = 200): string | null {
  return str(fd, key, max) || null;
}

export function optInt(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 999) throw new UserError(`"${key}" must be a whole number.`);
  return n;
}

function withMessage(path: string, kind: "ok" | "err", msg: string) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${kind}=${encodeURIComponent(msg)}`;
}

/**
 * Runs a form action and redirects back to `path` with a flash message.
 * UserErrors become an error banner; anything else is a real failure.
 * On success it goes to `successPath` when given.
 */
export async function runAction(
  path: string,
  fn: () => Promise<string | void>,
  successPath = path,
): Promise<never> {
  let msg: string | void;
  try {
    msg = await fn();
  } catch (e) {
    if (e instanceof UserError) redirect(withMessage(path, "err", e.message));
    throw e;
  }
  revalidatePath("/", "layout");
  redirect(msg ? withMessage(successPath, "ok", msg) : successPath);
}

const AVATAR_PREFIX = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export function validAvatar(value: string): string {
  if (!AVATAR_PREFIX.test(value) || value.length > 400_000) {
    throw new UserError("That image could not be used. Try a smaller JPG or PNG.");
  }
  return value;
}

export function validUsername(raw: string): string {
  const u = raw.toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(u)) {
    throw new UserError("Username must be 3-20 characters: letters, numbers or underscores.");
  }
  return u;
}

export function validPassword(p: string): string {
  if (p.length < 6) throw new UserError("Password must be at least 6 characters.");
  return p;
}
