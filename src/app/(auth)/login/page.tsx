import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { CognaraLogo } from "@/components/shared/cognara-logo";

export const metadata = {
  title: "Sign in — COGNARA™",
};

export default function LoginPage() {
  return (
    <>
      <div className="mb-8 text-center flex flex-col items-center">
        <CognaraLogo variant="icon" size={40} className="mb-3" />
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-cn-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-cn-ink-muted">
          Sign in to your student or coach workspace.
        </p>
      </div>
      <Suspense fallback={<p className="text-center text-sm text-cn-ink-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
      <p className="mt-8 text-center text-sm text-cn-ink-muted">
        No account?{" "}
        <Link className="font-semibold text-cn-orange hover:underline" href="/register">
          Create one
        </Link>
      </p>
    </>
  );
}
