import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { Avatar } from "./Avatar";
import type { Viewer } from "@/lib/session";

const LINKS = [
  ["/#standings", "Standings"],
  ["/schedule", "Schedule"],
  ["/#teams", "Teams"],
  ["/players", "Players"],
] as const;

export function Nav({ viewer, title }: { viewer: Viewer; title: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-14 place-items-center bg-gradient-to-r from-accent to-accent-2 font-display text-xl [clip-path:polygon(18%_0,100%_0,82%_100%,0_100%)]">
            2K
          </span>
          <span className="hidden font-display text-xl leading-none sm:block">{title}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm font-extrabold uppercase italic tracking-wider sm:gap-2">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="hidden px-2 py-1 hover:text-gold sm:block">
              {label}
            </Link>
          ))}
          {viewer?.role === "admin" ? (
            <>
              <Link href="/admin" className="btn btn-gold btn-sm">Admin</Link>
              <form action={logout}>
                <button className="btn btn-ghost btn-sm">Log out</button>
              </form>
            </>
          ) : viewer?.role === "player" ? (
            <>
              <Link href="/me" className="flex items-center gap-2 px-2 hover:text-gold">
                <Avatar src={viewer.player.avatar} name={viewer.player.display_name} size={32} />
                <span className="hidden md:block">{viewer.player.display_name}</span>
              </Link>
              <form action={logout}>
                <button className="btn btn-ghost btn-sm">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2 py-1 hover:text-gold">Log in</Link>
              <Link href="/signup" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </nav>
      </div>
      {/* Phones: page links get their own row */}
      <nav className="flex justify-around border-t border-line px-2 py-1.5 text-xs font-extrabold uppercase italic tracking-wider sm:hidden">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className="px-2 py-1 hover:text-gold">
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
