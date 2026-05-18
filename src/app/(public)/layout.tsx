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
      <footer className="border-t border-cn-border bg-cn-surface px-6 py-3 sm:px-12 lg:px-16 xl:px-24">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-cn-ink-subtle">
          <span>© {new Date().getFullYear()} COGNARA™ · SDG 4 Quality Education</span>
          <div className="flex gap-4">
            <a href="/legal/privacy" className="transition hover:text-cn-orange">Privacy</a>
            <a href="/legal/terms" className="transition hover:text-cn-orange">Terms</a>
            <a href="/setup" className="transition hover:text-cn-orange">Setup</a>
          </div>
        </div>
      </footer>
      <CookieBanner />
    </div>
  );
}
