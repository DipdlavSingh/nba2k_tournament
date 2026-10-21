import type { ReactNode } from "react";

export function AuthCard({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-6">
      <div className="panel rise p-6 sm:p-8">
        <span className="chip bg-accent text-white">{kicker}</span>
        <h1 className="mt-3 font-display text-5xl leading-none">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
