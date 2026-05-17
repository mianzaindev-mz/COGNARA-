"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CognaraLogo } from "@/components/shared/cognara-logo";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured for this environment.");
      return;
    }
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setEmail(data.user.email ?? null);
    });
  }, [router]);

  async function resend() {
    setError(null);
    setInfo(null);
    const supabase = createClient();
    if (!supabase || !email) {
      setError("Unable to resend: missing session or email.");
      return;
    }
    setLoading(true);
    const origin = window.location.origin;
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback`,
      },
    });
    setLoading(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setInfo("Confirmation email sent. Check your inbox and spam folder.");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cn-canvas px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-cn-border bg-cn-surface p-8 shadow-sm">
        <div className="flex flex-col gap-6 text-center items-center">
          <div className="flex flex-col items-center">
            <CognaraLogo variant="icon" size={40} className="mb-3" />
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-cn-ink">
              Verify your email
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-cn-ink-muted">
              Confirm the link we sent to{" "}
              <span className="font-medium text-cn-ink">
                {email ?? "your inbox"}
              </span>{" "}
              before accessing dashboards.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          {info ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              {info}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={loading || !email}
              onClick={() => void resend()}
              className="h-11 rounded-xl bg-cn-orange text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending…" : "Resend confirmation email"}
            </button>
            <div className="flex justify-center">
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
