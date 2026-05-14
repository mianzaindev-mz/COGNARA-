import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Forgot password — COGNARA™",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-sm font-medium tracking-[0.15em] text-[#6366F1]">
          COGNARA™
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#0A0A0A] dark:text-white">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          We will email you a secure link if the account exists.
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
