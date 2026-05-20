import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = {
  title: "Create account — COGNARA™",
};

export default function RegisterPage() {
  return (
    <AuthShell
      activeTab="register"
      title="Create an account"
      subtitle="Join the Cognara learning community today."
      showBackButton
    >
      <RegisterForm />
    </AuthShell>
  );
}
