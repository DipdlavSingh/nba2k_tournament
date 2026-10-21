import { nbaTeam, teamColors } from "@/lib/nba";

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words.slice(0, 3).map((w) => w[0]).join("") : name.slice(0, 3)).toUpperCase();
}

/** Shield badge drawn in the chosen NBA team's colours. */
export function TeamBadge({
  code,
  name,
  size = 48,
}: {
  code: string | null;
  name: string;
  size?: number;
}) {
  const { primary, secondary } = teamColors(code);
  const label = nbaTeam(code)?.code ?? initials(name || "?");
  const id = `b-${(code ?? "x") + Math.round(size)}`;
  return (
    <svg width={size} height={size * 1.12} viewBox="0 0 100 112" aria-hidden className="shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)]">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={primary} />
          <stop offset="1" stopColor={primary} stopOpacity="0.75" />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <path d="M50 4 L94 18 V58 C94 84 74 100 50 108 C26 100 6 84 6 58 V18 Z" />
        </clipPath>
      </defs>
      <path d="M50 4 L94 18 V58 C94 84 74 100 50 108 C26 100 6 84 6 58 V18 Z" fill={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-c)`}>
        <path d="M-10 70 L110 30 L110 46 L-10 86 Z" fill={secondary} opacity="0.9" />
        <circle cx="78" cy="88" r="30" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
        <path d="M48 58 C62 72 64 96 56 112" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
      </g>
      <path
        d="M50 4 L94 18 V58 C94 84 74 100 50 108 C26 100 6 84 6 58 V18 Z"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="3"
      />
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontFamily="var(--font-anton), Impact, sans-serif"
        fontStyle="italic"
        fontSize={label.length > 2 ? 30 : 36}
        fill="#fff"
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="1.5"
        paintOrder="stroke"
      >
        {label}
      </text>
    </svg>
  );
}
