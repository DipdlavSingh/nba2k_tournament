"use client";

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn btn-primary",
  confirm,
  formAction,
}: {
  children: ReactNode;
  className?: string;
  confirm?: string;
  /** Submit the surrounding form to a different server action. */
  formAction?: (fd: FormData) => Promise<void>;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      formAction={formAction}
      formNoValidate={!!formAction}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

function fmt(iso: string, style: "full" | "short") {
  const d = new Date(iso);
  return style === "full"
    ? d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** True only after hydration, so time zone dependent output never mismatches the server render. */
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Formats a timestamp in the viewer's own time zone. */
export function LocalTime({ iso, style = "full" }: { iso: string | null; style?: "full" | "short" }) {
  const mounted = useMounted();
  if (!iso) return <span className="text-mute">TBD</span>;
  return <time dateTime={iso}>{mounted ? fmt(iso, style) : "\u00a0"}</time>;
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local picker that submits an ISO timestamp, so time zones survive the trip to the server. */
export function DateTimeInput({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const mounted = useMounted();
  const [iso, setIso] = useState(defaultValue ?? "");
  return (
    <>
      <input
        key={mounted ? "client" : "server"}
        type="datetime-local"
        className="input"
        defaultValue={mounted ? toLocalInput(defaultValue ?? null) : ""}
        onChange={(e) => setIso(e.target.value ? new Date(e.target.value).toISOString() : "")}
      />
      <input type="hidden" name={name} value={iso} />
    </>
  );
}

/** Picks an image, crops it square and shrinks it to a small JPEG in the browser. */
export function AvatarPicker({ current, name }: { current: string | null; name: string }) {
  const [data, setData] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    try {
      const bitmap = await createImageBitmap(file);
      const side = Math.min(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 320;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 320, 320);
      setData(canvas.toDataURL("image/jpeg", 0.85));
    } catch {
      setError("Couldn't read that image. Try a JPG or PNG.");
    }
  }

  const preview = data || current;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div
        className="h-28 w-28 overflow-hidden bg-panel-2"
        style={{ clipPath: "polygon(14% 0, 100% 0, 86% 100%, 0 100%)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview ? <img src={preview} alt="Preview" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="flex flex-col gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
          Choose photo
        </button>
        <input type="hidden" name={name} value={data} />
        {data ? <SubmitButton className="btn btn-primary btn-sm">Save photo</SubmitButton> : null}
        {error ? <p className="text-sm text-accent">{error}</p> : null}
      </div>
    </div>
  );
}

const BANNER_MAX_WIDTH = 1800;
const BANNER_MAX_CHARS = 1_200_000;

/**
 * Picks a banner image and shrinks it to a JPEG in the browser (aspect ratio kept).
 * The new image is sent with the surrounding form; nothing is saved until it is submitted.
 */
export function BannerPicker({ current, name }: { current: string | null; name: string }) {
  const [data, setData] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    try {
      const bitmap = await createImageBitmap(file);
      let width = Math.min(bitmap.width, BANNER_MAX_WIDTH);
      for (let attempt = 0; attempt < 6; attempt++) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = Math.round((bitmap.height / bitmap.width) * width);
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#05060a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL("image/jpeg", 0.82);
        if (url.length <= BANNER_MAX_CHARS) return setData(url);
        width = Math.round(width * 0.8);
      }
      setError("That image is too large even after shrinking. Try a smaller one.");
    } catch {
      setError("Couldn't read that image. Try a JPG or PNG.");
    }
  }

  const preview = data || current;
  return (
    <div className="space-y-2">
      <div className="relative aspect-[3/1] w-full overflow-hidden border border-line bg-panel-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview ? <img src={preview} alt="Banner preview" className="h-full w-full object-cover" /> : (
          <div className="grid h-full place-items-center text-xs font-bold uppercase tracking-widest text-mute">
            No banner image
          </div>
        )}
        {data ? <span className="chip absolute left-2 top-2 bg-gold text-black">New · save to apply</span> : null}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <input type="hidden" name={name} value={data} />
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
        {preview ? "Replace image" : "Upload image"}
      </button>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </div>
  );
}
