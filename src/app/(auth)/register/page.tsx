import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { CognaraLogo } from "@/components/shared/cognara-logo";

export const metadata = {
  title: "Create account — COGNARA™",
};

export default function RegisterPage() {
  return (
    <>
      <div className="mb-8 text-center flex flex-col items-center">
        <CognaraLogo variant="icon" size={40} className="mb-3" />
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-cn-ink">Create account</h1>
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
