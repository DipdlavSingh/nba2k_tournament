import Link from "next/link";
import { TeamBadge } from "./TeamBadge";
import { TIEBREAK_LABELS, type StandingRow } from "@/lib/standings";

function signed(n: number) {
  return n > 0 ? `+${n}` : String(n);
}

export function Leaderboard({ rows, finalists }: { rows: StandingRow[]; finalists: string[] }) {
  if (!rows.length) {
    return <p className="text-mute">No teams yet. Once the admin pairs players into teams they show up here.</p>;
  }
  const usedTiebreaks = [...new Set(rows.map((r) => r.tiebreak).filter(Boolean))] as (keyof typeof TIEBREAK_LABELS)[];
  return (
    <div>
      {/* Phones: compact list */}
      <ol className="-mx-5 divide-y divide-white/5 sm:hidden">
        {rows.map((r, i) => (
          <li key={r.team.id} className={i === 1 && rows.length > 2 ? "border-b-2 border-dashed border-gold/60" : ""}>
            <Link href={`/teams/${r.team.id}`} className="flex items-center gap-3 px-5 py-3">
              <span className={`stat-num w-5 text-2xl ${r.rank === 1 ? "text-gold" : r.rank === 2 ? "text-[#d6dbe6]" : "text-mute"}`}>
                {r.rank}
              </span>
              <TeamBadge code={r.team.nba_team} name={r.team.name} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base">{r.team.name}</span>
                <span className="text-xs font-bold text-mute">
                  {r.gp ? `${r.pct.toFixed(3).replace(/^0/, "")} · PF ${r.pf} · PA ${r.pa}` : "No games yet"}
                  {r.tiebreak ? <span className="ml-1 text-ice">TB·{r.tiebreak}</span> : null}
                </span>
              </span>
              <span className="text-right">
                <span className="stat-num block text-xl">{r.w}-{r.l}</span>
                <span className={`text-xs font-bold ${r.pd > 0 ? "text-win" : r.pd < 0 ? "text-[#ff8090]" : "text-mute"}`}>
                  {signed(r.pd)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="-mx-5 hidden overflow-x-auto sm:-mx-6 sm:block">
        <table className="lb-table w-full min-w-[720px] text-left">
          <thead>
            <tr>
              <th className="pl-5 sm:pl-6"># Team</th>
              <th className="text-center">GP</th>
              <th className="text-center">W</th>
              <th className="text-center">L</th>
              <th className="text-center">Win %</th>
              <th className="text-center">PF</th>
              <th className="text-center">PA</th>
              <th className="text-center">Diff</th>
              <th className="text-center">Avg Margin</th>
              <th className="text-center">Strk</th>
              <th className="pr-5 text-center sm:pr-6">Last 5</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const inFinals = finalists.includes(r.team.id);
              return (
                <tr key={r.team.id} className={i === 1 && rows.length > 2 ? "finals-line" : ""}>
                  <td className="pl-5 sm:pl-6">
                    <Link href={`/teams/${r.team.id}`} className="flex items-center gap-3 hover:text-gold">
                      <span className={`stat-num w-6 text-2xl ${r.rank === 1 ? "text-gold" : r.rank === 2 ? "text-[#d6dbe6]" : "text-mute"}`}>
                        {r.rank}
                      </span>
                      <TeamBadge code={r.team.nba_team} name={r.team.name} size={34} />
                      <span className="font-display text-lg">{r.team.name}</span>
                      {inFinals ? <span className="chip bg-gold/15 text-gold">Finals</span> : null}
                      {r.tiebreak ? (
                        <span className="chip text-ice" title={`Placed by tiebreaker: ${TIEBREAK_LABELS[r.tiebreak]}`}>
                          TB·{r.tiebreak}
                        </span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="text-center">{r.gp}</td>
                  <td className="text-center text-win">{r.w}</td>
                  <td className="text-center text-[#ff8090]">{r.l}</td>
                  <td className="text-center">{r.gp ? r.pct.toFixed(3).replace(/^0/, "") : "—"}</td>
                  <td className="text-center">{r.pf}</td>
                  <td className="text-center">{r.pa}</td>
                  <td className={`text-center ${r.pd > 0 ? "text-win" : r.pd < 0 ? "text-[#ff8090]" : ""}`}>{signed(r.pd)}</td>
                  <td className="text-center">{r.gp ? signed(Math.round((r.pd / r.gp) * 10) / 10) : "—"}</td>
                  <td className={`text-center ${r.streak.startsWith("W") ? "text-win" : r.streak.startsWith("L") ? "text-[#ff8090]" : ""}`}>
                    {r.streak}
                  </td>
                  <td className="pr-5 sm:pr-6">
                    <div className="flex justify-center gap-1">
                      {r.last5.length
                        ? r.last5.map((x, k) => (
                            <span
                              key={k}
                              className={`grid h-5 w-5 place-items-center text-[10px] font-black ${x === "W" ? "bg-win/20 text-win" : "bg-accent/20 text-[#ff8090]"}`}
                            >
                              {x}
                            </span>
                          ))
                        : <span className="text-mute">—</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-mute">
        <span>
          <span className="font-bold text-gold">Top 2</span> advance to the best-of-3 Finals.
        </span>
        <span>
          Tiebreakers in order: win %, head-to-head, point differential, points scored, fewest points allowed.
        </span>
        {usedTiebreaks.map((t) => (
          <span key={t}>
            <span className="font-bold text-ice">TB·{t}</span> = {TIEBREAK_LABELS[t]}
          </span>
        ))}
      </div>
    </div>
  );
}
