import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = {
  title: "Sign in — COGNARA™",
};

export default function LoginPage() {
  return (
    <AuthShell
      activeTab="login"
      title="Welcome back"
      subtitle="Sign in to your student or coach workspace."
    >
      <Suspense fallback={<p className="text-sm text-cn-ink-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
