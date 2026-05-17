import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { CognaraLogo } from "@/components/shared/cognara-logo";

export const metadata = {
  title: "Forgot password — COGNARA™",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-8 text-center flex flex-col items-center">
        <CognaraLogo variant="icon" size={40} className="mb-3" />
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-cn-ink">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-cn-ink-muted">
          We will email you a secure link if the account exists.
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
