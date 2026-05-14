import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Set new password — COGNARA™",
};

export default function ResetPasswordPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-sm font-medium tracking-[0.15em] text-[#6366F1]">
          COGNARA™
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#0A0A0A] dark:text-white">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Open this page from the link in your email so the secure token is
          present in the URL.
        </p>
      </div>
      <ResetPasswordForm />
    </>
  );
}
