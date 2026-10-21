import type { Metadata } from "next";
import { adminLogin } from "@/app/actions/auth";
import { AuthCard } from "@/components/AuthCard";
import { SubmitButton } from "@/components/client";
import { Field, Flash } from "@/components/ui";

export const metadata: Metadata = { title: "Admin login" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { ok, err } = (await searchParams) as { ok?: string; err?: string };
  const configured = !!(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
  return (
    <AuthCard title="Commissioner" kicker="Admin">
      <Flash ok={ok} err={err} />
      {configured ? (
        <form action={adminLogin} className="space-y-4">
          <Field label="Admin username">
            <input name="username" className="input" autoComplete="username" required />
          </Field>
          <Field label="Admin password">
            <input name="password" type="password" className="input" autoComplete="current-password" required />
          </Field>
          <SubmitButton className="btn btn-gold w-full">Enter admin</SubmitButton>
        </form>
      ) : (
        <p className="text-mute">
          Admin login is disabled. Set <code className="text-gold">ADMIN_USERNAME</code> and{" "}
          <code className="text-gold">ADMIN_PASSWORD</code> environment variables.
        </p>
      )}
    </AuthCard>
  );
}
