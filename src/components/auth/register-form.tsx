"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerSchema } from "@/lib/validation/schemas/auth.schema";
import { createClient } from "@/lib/supabase/client";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

const inputClass =
  "h-12 rounded-2xl border border-cn-border bg-cn-canvas px-4 text-cn-ink outline-none focus:ring-2 focus:ring-cn-orange/35";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"student" | "coach">("student");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const parsed = registerSchema.safeParse({
      email,
      password,
      confirmPassword,
      fullName,
      role,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError(
        "Backend not connected. Add Supabase keys to .env.local and restart the dev server.",
      );
      return;
    }

    setLoading(true);
    const origin = window.location.origin;
    const { data, error: signError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback`,
        data: {
          full_name: parsed.data.fullName,
          role: parsed.data.role,
        },
      },
    });
    setLoading(false);

    if (signError) {
      setError(signError.message);
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setInfo("Check your email to confirm your account before signing in.");
  }

  return (
    <div className="flex flex-col gap-8">
      <OAuthButtons redirectTo="/dashboard" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-cn-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-cn-surface px-3 text-cn-ink-subtle">or create with email</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex rounded-2xl border border-cn-border p-1">
          <button
            type="button"
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              role === "student"
                ? "bg-cn-orange text-white"
                : "text-cn-ink-muted hover:bg-cn-canvas"
            }`}
            onClick={() => setRole("student")}
          >
            Student
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              role === "coach"
                ? "bg-cn-orange text-white"
                : "text-cn-ink-muted hover:bg-cn-canvas"
            }`}
            onClick={() => setRole("coach")}
          >
            Coach
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-cn-ink">Full name</span>
          <input
            className={inputClass}
            value={fullName}
            onChange={(ev) => setFullName(ev.target.value)}
            autoComplete="name"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-cn-ink">Email</span>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-cn-ink">Password</span>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            autoComplete="new-password"
            required
          />
          <span className="text-xs text-cn-ink-muted">
            Min 8 characters, uppercase, number, and special character.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-cn-ink">Confirm password</span>
          <input
            className={inputClass}
            type="password"
            value={confirmPassword}
            onChange={(ev) => setConfirmPassword(ev.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        {error ? (
          <div className="rounded-lg border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            <p>{error}</p>
            {error.includes("Backend") || error.includes(".env.local") ? (
              <Link href="/setup" className="mt-1.5 inline-block text-xs font-semibold text-cn-orange hover:underline">
                Setup checklist →
              </Link>
            ) : null}
          </div>
        ) : null}
        {info ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{info}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-2xl bg-cn-orange text-sm font-bold text-white shadow-md transition hover:bg-cn-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-xs text-cn-ink-muted">
        By creating an account you agree that paid transactions must remain on COGNARA and that
        off-platform solicitation violates the Terms of Service.
      </p>
    </div>
  );
}
