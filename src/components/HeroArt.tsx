/** Decorative hero artwork: glowing ball, light streaks and a half court in perspective. */
export function HeroArt() {
  return (
    <svg viewBox="0 0 600 520" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="ball" cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#ffb36b" />
          <stop offset="0.45" stopColor="#f26a1b" />
          <stop offset="1" stopColor="#7a2406" />
        </radialGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ff2d46" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff2d46" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="streak" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.7" stopColor="#ffc629" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fd1ff" stopOpacity="0" />
          <stop offset="1" stopColor="#4fd1ff" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* perspective court */}
      <g stroke="url(#floor)" strokeWidth="2" fill="none">
        <path d="M40 500 L200 330 H400 L560 500" />
        <path d="M150 500 L245 390 H355 L450 500" />
        <ellipse cx="300" cy="390" rx="55" ry="16" />
        <path d="M90 500 C150 380 450 380 510 500" />
      </g>

      {/* speed streaks */}
      <g opacity="0.85">
        <rect x="-40" y="140" width="420" height="5" fill="url(#streak)" transform="rotate(-18 200 140)" />
        <rect x="0" y="210" width="360" height="3" fill="url(#streak)" transform="rotate(-18 200 210)" />
        <rect x="60" y="300" width="300" height="2" fill="url(#streak)" transform="rotate(-18 200 300)" />
      </g>

      <circle cx="350" cy="210" r="210" fill="url(#halo)" />

      {/* basketball */}
      <g className="spin-slow">
        <circle cx="350" cy="210" r="130" fill="url(#ball)" />
        <g fill="none" stroke="#2a0d02" strokeWidth="7" strokeLinecap="round">
          <path d="M220 210 H480" />
          <path d="M350 80 V340" />
          <path d="M258 118 C310 170 310 250 258 302" />
          <path d="M442 118 C390 170 390 250 442 302" />
        </g>
        <circle cx="350" cy="210" r="130" fill="none" stroke="#2a0d02" strokeWidth="5" />
        <ellipse cx="305" cy="150" rx="46" ry="26" fill="#fff" opacity="0.18" transform="rotate(-30 305 150)" />
      </g>

      {/* hoop */}
      <g transform="translate(70 40)">
        <rect x="0" y="0" width="120" height="80" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="4" />
        <rect x="38" y="36" width="44" height="30" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="3" />
        <ellipse cx="60" cy="92" rx="30" ry="7" fill="none" stroke="#ff2d46" strokeWidth="5" />
        <path d="M32 94 L42 140 M88 94 L78 140 M46 96 L52 140 M74 96 L68 140 M60 99 V140" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" />
      </g>
    </svg>
  );
}
