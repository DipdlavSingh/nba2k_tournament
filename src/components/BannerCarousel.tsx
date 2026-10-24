"use client";

import { useEffect, useRef, useState } from "react";

export type Slide = { id: string; src: string; alt: string };

const INTERVAL_MS = 5000;

/** Home page banners. Auto-advances when there is more than one; pauses on hover, focus or reduced motion. */
export function BannerCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  if (!count) return null;
  const current = index % count;
  const go = (i: number) => setIndex((i + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured games"
      className="panel rise relative overflow-hidden p-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div
        className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div
            key={s.id}
            className="aspect-[3/1] w-full shrink-0"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== current}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- served by our own cached route */}
            <img src={s.src} alt={s.alt} className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
          </div>
        ))}
      </div>

      {count > 1 ? (
        <>
          {[
            ["Previous banner", -1, "left-2", "M15 5 8 12l7 7"],
            ["Next banner", 1, "right-2", "M9 5l7 7-7 7"],
          ].map(([label, step, side, path]) => (
            <button
              key={label as string}
              type="button"
              aria-label={label as string}
              onClick={() => go(current + (step as number))}
              className={`absolute ${side} top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center bg-black/55 text-white backdrop-blur transition hover:bg-accent sm:h-11 sm:w-11`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3">
                <path d={path as string} />
              </svg>
            </button>
          ))}
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2 sm:bottom-3">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Show banner ${i + 1}`}
                aria-current={i === current}
                onClick={() => go(i)}
                className={`h-1.5 transition-all sm:h-2 ${i === current ? "w-8 bg-accent" : "w-4 bg-white/50 hover:bg-white"}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
