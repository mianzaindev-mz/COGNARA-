import { CookieBanner } from "@/components/public/cookie-banner";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main>{children}</main>
      <CookieBanner />
    </>
  );
}
