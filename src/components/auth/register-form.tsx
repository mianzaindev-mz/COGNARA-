"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerSchema } from "@/lib/validation/schemas/auth.schema";
import { createClient } from "@/lib/supabase/client";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

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

    setInfo(
      "Check your email to confirm your account before signing in.",
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <OAuthButtons redirectTo="/dashboard" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-white px-3 text-neutral-500 dark:bg-[#141414] dark:text-neutral-400">
            or create with email
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              role === "student"
                ? "bg-[#6366F1] text-white"
                : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900"
            }`}
            onClick={() => setRole("student")}
          >
            Student
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              role === "coach"
                ? "bg-[#6366F1] text-white"
                : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900"
            }`}
            onClick={() => setRole("coach")}
          >
            Coach
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-800 dark:text-neutral-100">
            Full name
          </span>
          <input
            className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-neutral-900 outline-none ring-[#6366F1] focus:ring-2 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            value={fullName}
            onChange={(ev) => setFullName(ev.target.value)}
            autoComplete="name"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-800 dark:text-neutral-100">
            Email
          </span>
          <input
            className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-neutral-900 outline-none ring-[#6366F1] focus:ring-2 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-800 dark:text-neutral-100">
            Password
          </span>
          <input
            className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-neutral-900 outline-none ring-[#6366F1] focus:ring-2 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            type="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            autoComplete="new-password"
            required
          />
          <span className="text-xs text-neutral-500">
            Min 8 characters, uppercase, number, and special character.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-800 dark:text-neutral-100">
            Confirm password
          </span>
          <input
            className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-neutral-900 outline-none ring-[#6366F1] focus:ring-2 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
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
            {(error.includes("Backend") || error.includes(".env.local")) ? (
              <Link href="/setup" className="mt-1.5 inline-block text-xs font-semibold text-[#6366F1] hover:underline">
                Setup checklist →
              </Link>
            ) : null}
          </div>
        ) : null}
        {info ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{info}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-lg bg-[#6366F1] text-sm font-semibold text-white transition hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
        By creating an account you agree that paid transactions must remain on
        COGNARA and that off-platform solicitation violates the Terms of Service.
      </p>
    </div>
  );
}
