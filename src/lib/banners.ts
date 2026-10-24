import type { Game } from "./types";

export type BannerState = "none" | "off" | "active" | "expired";

/** "none": no image yet; "off": image but unticked; "expired": past its end date. */
export function bannerState(g: Game, now = Date.now()): BannerState {
  if (!g.banner_version) return "none";
  if (!g.banner_active) return "off";
  if (g.banner_until && new Date(g.banner_until).getTime() <= now) return "expired";
  return "active";
}

export function bannerSrc(g: Game) {
  return `/banners/${g.id}?v=${encodeURIComponent(g.banner_version ?? "")}`;
}
