import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify email — COGNARA™",
  description: "Confirm your email address to activate your COGNARA account.",
};

export default function VerifyEmailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
