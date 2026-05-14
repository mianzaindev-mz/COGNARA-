"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignOutButton } from "@/components/auth/sign-out-button";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] px-4 py-16 dark:bg-[#0A0A0A]">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-[#141414]">
        <div className="flex flex-col gap-6 text-center">
          <div>
            <p className="text-sm font-medium tracking-[0.15em] text-[#6366F1]">
              COGNARA™
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#0A0A0A] dark:text-white">
              Verify your email
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              Confirm the link we sent to{" "}
              <span className="font-medium text-neutral-900 dark:text-white">
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
              className="h-11 rounded-lg bg-[#6366F1] text-sm font-semibold text-white transition hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-60"
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
