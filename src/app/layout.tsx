import type { Metadata } from "next";
import { Anton, Barlow_Condensed } from "next/font/google";
import { Nav } from "@/components/Nav";
import { getSettings } from "@/lib/data";
import { getViewer } from "@/lib/session";
import { usingLocalStore } from "@/lib/store";
import "./globals.css";

const anton = Anton({ variable: "--font-anton", weight: "400", subsets: ["latin"] });
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

// Every page shows live tournament data.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: s.name, template: `%s · ${s.name}` },
    description: `${s.name} — NBA 2K26 2v2 tournament standings, schedule and teams.`,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [viewer, settings] = await Promise.all([getViewer(), getSettings()]);
  return (
    <html lang="en" className={`${anton.variable} ${barlow.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Nav viewer={viewer} title={settings.name} />
        {usingLocalStore && process.env.NODE_ENV !== "production" ? (
          <div className="bg-gold/10 px-4 py-1 text-center text-xs font-bold uppercase tracking-widest text-gold">
            Dev mode: saving to .data/db.json — set Supabase env vars to use the real database
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <footer className="border-t border-line py-6 text-center text-xs uppercase tracking-widest text-mute">
          {settings.name} · {settings.season} · Fan-run tournament, not affiliated with the NBA or 2K
        </footer>
      </body>
    </html>
  );
}
