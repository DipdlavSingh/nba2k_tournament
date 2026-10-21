import Link from "next/link";
import type { Metadata } from "next";
import { signup } from "@/app/actions/auth";
import { AuthCard } from "@/components/AuthCard";
import { SubmitButton } from "@/components/client";
import { Field, Flash } from "@/components/ui";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { ok, err } = (await searchParams) as { ok?: string; err?: string };
  const settings = await getSettings();
  return (
    <AuthCard title="Create player" kicker="Sign up">
      <Flash ok={ok} err={err} />
      {settings.registration_open ? (
        <form action={signup} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username">
              <input name="username" className="input" autoComplete="username" pattern="[A-Za-z0-9_]{3,20}" required />
            </Field>
            <Field label="Display name">
              <input name="display_name" className="input" maxLength={30} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password">
              <input name="password" type="password" className="input" autoComplete="new-password" minLength={6} required />
            </Field>
            <Field label="Confirm password">
              <input name="confirm" type="password" className="input" autoComplete="new-password" minLength={6} required />
            </Field>
          </div>
          <Field label="PSN / Xbox gamertag (optional)">
            <input name="gamertag" className="input" maxLength={30} />
          </Field>
          <Field label="Tagline (optional)">
            <input name="tagline" className="input" maxLength={80} placeholder="Cash from deep." />
          </Field>
          <p className="text-sm text-mute">
            After signing up, the admin pairs you with a teammate. Then you and your teammate can set your team name and NBA team.
          </p>
          <SubmitButton className="btn btn-primary w-full">Create account</SubmitButton>
        </form>
      ) : (
        <p className="text-mute">Registration is closed. Ask the admin to add you.</p>
      )}
      <p className="mt-6 text-sm text-mute">
        Already have an account? <Link href="/login" className="font-bold text-gold">Log in</Link>
      </p>
    </AuthCard>
  );
}
