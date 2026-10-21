/* eslint-disable @next/next/no-img-element -- avatars are small data URLs */

/** Player portrait in a slanted frame; falls back to a silhouette. */
export function Avatar({
  src,
  name,
  size = 56,
  accent = "#ff2d46",
}: {
  src: string | null;
  name: string;
  size?: number;
  accent?: string;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden bg-panel-2"
      style={{
        width: size,
        height: size,
        clipPath: "polygon(14% 0, 100% 0, 86% 100%, 0 100%)",
        boxShadow: `inset 0 -4px 0 ${accent}`,
      }}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-label={name}>
          <rect width="100" height="100" fill="#1b2130" />
          <circle cx="50" cy="38" r="18" fill="#3a4258" />
          <path d="M18 100 C20 72 34 62 50 62 C66 62 80 72 82 100 Z" fill="#3a4258" />
        </svg>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1" style={{ background: accent }} />
    </div>
  );
}
