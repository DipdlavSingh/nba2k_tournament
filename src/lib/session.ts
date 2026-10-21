import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { timingSafeEqual } from "crypto";
import { store } from "./store";
import { toPublic } from "./data";
import type { PublicPlayer } from "./types";

const COOKIE = "nba2k_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production.");
  }
  return new TextEncoder().encode(s ?? "dev-only-insecure-secret-change-me");
}

type Claims = { sub: string; role: "player" | "admin" };

export async function startSession(claims: Claims) {
  const token = await new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

async function readClaims(): Promise<Claims | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const role = payload.role === "admin" ? "admin" : "player";
    return payload.sub ? { sub: payload.sub, role } : null;
  } catch {
    return null;
  }
}

export type Viewer = { role: "admin" } | { role: "player"; player: PublicPlayer } | null;

export async function getViewer(): Promise<Viewer> {
  const claims = await readClaims();
  if (!claims) return null;
  if (claims.role === "admin") return { role: "admin" };
  const player = (await store.list("players")).find((p) => p.id === claims.sub);
  if (!player) return null;
  return { role: "player", player: toPublic(player) };
}

export async function requirePlayer(): Promise<PublicPlayer> {
  const v = await getViewer();
  if (v?.role !== "player") redirect("/login");
  return v.player;
}

export async function requireAdmin(): Promise<void> {
  const v = await getViewer();
  if (v?.role !== "admin") redirect("/admin/login");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkAdminCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  return safeEqual(username, u) && safeEqual(password, p);
}
