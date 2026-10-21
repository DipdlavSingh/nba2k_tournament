import Link from "next/link";
import type { Metadata } from "next";
import { login } from "@/app/actions/auth";
import { AuthCard } from "@/components/AuthCard";
import { SubmitButton } from "@/components/client";
import { Field, Flash } from "@/components/ui";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { ok, err } = (await searchParams) as { ok?: string; err?: string };
  return (
    <AuthCard title="Log in" kicker="Player">
      <Flash ok={ok} err={err} />
      <form action={login} className="space-y-4">
        <Field label="Username">
          <input name="username" className="input" autoComplete="username" required />
        </Field>
        <Field label="Password">
          <input name="password" type="password" className="input" autoComplete="current-password" required />
        </Field>
        <SubmitButton className="btn btn-primary w-full">Let&apos;s go</SubmitButton>
      </form>
      <p className="mt-6 text-sm text-mute">
        New here? <Link href="/signup" className="font-bold text-gold">Create an account</Link>
        <span className="mx-2">·</span>
        <Link href="/admin/login" className="hover:text-white">Admin</Link>
      </p>
    </AuthCard>
  );
}
