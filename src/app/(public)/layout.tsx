import { CookieBanner } from "@/components/public/cookie-banner";
import { PublicHeader } from "@/components/public/public-header";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-cn-canvas text-cn-ink">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-cn-border bg-cn-surface px-4 py-8 text-center text-xs text-cn-ink-subtle sm:px-8">
        <p>COGNARA™ · SDG 4 Quality Education</p>
        <p className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <a href="/legal/privacy" className="hover:text-cn-orange">
            Privacy
          </a>
          <a href="/legal/terms" className="hover:text-cn-orange">
            Terms
          </a>
          <a href="/setup" className="hover:text-cn-orange">
            Setup
          </a>
        </p>
      </footer>
      <CookieBanner />
    </div>
  );
}
