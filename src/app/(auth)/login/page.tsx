import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign in — COGNARA™",
};

export default function LoginPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-sm font-medium tracking-[0.15em] text-[#6366F1]">
          COGNARA™
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#0A0A0A] dark:text-white">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Access your student or coach workspace.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-center text-sm text-neutral-500">Loading…</p>
        }
      >
        <LoginForm />
      </Suspense>
      <p className="mt-8 text-center text-sm text-neutral-600 dark:text-neutral-300">
        No account?{" "}
        <Link
          className="font-medium text-[#6366F1] hover:underline"
          href="/register"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
