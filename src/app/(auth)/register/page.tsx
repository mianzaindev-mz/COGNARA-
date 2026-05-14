import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Create account — COGNARA™",
};

export default function RegisterPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-sm font-medium tracking-[0.15em] text-[#6366F1]">
          COGNARA™
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#0A0A0A] dark:text-white">
          Create account
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Start as a student or apply the coach path (verification follows).
        </p>
      </div>
      <RegisterForm />
      <p className="mt-8 text-center text-sm text-neutral-600 dark:text-neutral-300">
        Already registered?{" "}
        <Link
          className="font-medium text-[#6366F1] hover:underline"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
