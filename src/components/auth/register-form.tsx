"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerSchema } from "@/lib/validation/schemas/auth.schema";
import { createClient } from "@/lib/supabase/client";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

const inputClass =
  "w-full px-4 py-3 bg-cn-canvas border border-cn-border focus:border-cn-orange focus:ring-4 focus:ring-cn-orange/10 outline-none rounded-xl text-cn-ink transition-all";

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
    <>
      <div className="mb-6">
        <OAuthButtons redirectTo="/dashboard" />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="h-[1px] flex-1 bg-cn-border"></div>
        <span className="text-[10px] font-bold text-cn-ink-subtle uppercase tracking-widest">OR EMAIL</span>
        <div className="h-[1px] flex-1 bg-cn-border"></div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex bg-cn-canvas p-1 rounded-xl">
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              role === "student"
                ? "bg-cn-surface shadow-sm text-cn-ink border border-cn-border"
                : "text-cn-ink-muted hover:text-cn-ink"
            }`}
            onClick={() => setRole("student")}
          >
            Student
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              role === "coach"
                ? "bg-cn-surface shadow-sm text-cn-ink border border-cn-border"
                : "text-cn-ink-muted hover:text-cn-ink"
            }`}
            onClick={() => setRole("coach")}
          >
            Coach
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-sm text-cn-ink ml-1">Full name</label>
          <input
            className={inputClass}
            placeholder="John Doe"
            value={fullName}
            onChange={(ev) => setFullName(ev.target.value)}
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-sm text-cn-ink ml-1">Email</label>
          <input
            className={inputClass}
            placeholder="name@example.com"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-sm text-cn-ink ml-1">Password</label>
          <input
            className={inputClass}
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-cn-ink-subtle ml-1">
            Min 8 chars, uppercase, number, special char.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-sm text-cn-ink ml-1">Confirm password</label>
          <input
            className={inputClass}
            placeholder="••••••••"
            type="password"
            value={confirmPassword}
            onChange={(ev) => setConfirmPassword(ev.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 mt-2">
            <p>{error}</p>
            {error.includes("Backend") || error.includes(".env.local") ? (
              <Link href="/setup" className="mt-1.5 inline-block text-xs font-semibold text-cn-orange hover:underline">
                Setup checklist →
              </Link>
            ) : null}
          </div>
        ) : null}
        {info ? <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">{info}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-cn-orange text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(255,107,61,0.39)] hover:opacity-90 active:scale-[0.99] transition-all mt-6 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="mt-8 text-center flex flex-col gap-4">
        <p className="text-sm text-cn-ink-subtle">
          Already have an account?{" "}
          <Link className="font-medium text-cn-orange hover:underline underline-offset-4 ml-1" href="/login">
            Sign In
          </Link>
        </p>
        <p className="text-center text-[11px] text-cn-ink-subtle px-4">
          By creating an account you agree to the Terms of Service.
        </p>
      </div>
    </>
  );
}
