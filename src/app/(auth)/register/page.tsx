import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Create account — COGNARA™",
};

export default function RegisterPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-cn-orange">COGNARA™</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-cn-ink">Create account</h1>
        <p className="mt-2 text-sm text-cn-ink-muted">
          Start as a student or choose coach — verification unlocks publishing.
        </p>
      </div>
      <RegisterForm />
      <p className="mt-8 text-center text-sm text-cn-ink-muted">
        Already registered?{" "}
        <Link
          className="font-semibold text-cn-orange hover:underline"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
