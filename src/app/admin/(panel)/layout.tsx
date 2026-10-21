import Link from "next/link";
import { requireAdmin } from "@/lib/session";

const TABS = [
  ["/admin", "Overview"],
  ["/admin/players", "Players"],
  ["/admin/teams", "Teams"],
  ["/admin/games", "Schedule & scores"],
] as const;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip bg-gold text-black">Admin</span>
          <h1 className="mt-2 font-display text-5xl leading-none">Commissioner&apos;s Office</h1>
        </div>
      </div>
      <nav className="flex flex-wrap gap-2">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} className="btn btn-ghost btn-sm">
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
