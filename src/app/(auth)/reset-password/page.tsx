import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { CognaraLogo } from "@/components/shared/cognara-logo";

export const metadata = {
  title: "Set new password — COGNARA™",
};

export default function ResetPasswordPage() {
  return (
    <>
      <div className="mb-8 text-center flex flex-col items-center">
        <CognaraLogo variant="icon" size={40} className="mb-3" />
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-cn-ink">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm text-cn-ink-muted">
          Open this page from the link in your email so the secure token is
          present in the URL.
        </p>
      </div>
      <ResetPasswordForm />
    </>
  );
}
