import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CognaraLogo } from "@/components/shared/cognara-logo";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-full bg-cn-surface text-cn-ink font-body">
      {/* Left Panel: Branding & Marketing */}
      <section className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-[#131313] to-[#1c1b1b] p-16 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cn-orange/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-cn-lavender/5 rounded-full blur-[100px]"></div>
        
        <div className="z-10">
          <div className="flex items-center gap-3 mb-16">
            <Link href="/" className="inline-block">
              <CognaraLogo variant="full" size={32} onDark />
            </Link>
          </div>
          <div className="max-w-md">
            <h2 className="font-headline text-5xl mb-6 leading-tight font-bold">Where knowledge finds its place.</h2>
            <p className="text-white/70 mb-12 text-lg">Warm, focused learning — courses, code lab, AI agent, and progress in one student hub.</p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-cn-yellow flex items-center justify-center text-yellow-900 shrink-0 font-bold">1</div>
                <p className="text-white/90 pt-1">Enroll in courses with clear progress tracking</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-cn-lavender flex items-center justify-center text-white shrink-0 font-bold">2</div>
                <p className="text-white/90 pt-1">Learn with a tool-using AI tutor by your side</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-cn-orange flex items-center justify-center text-white shrink-0 font-bold">3</div>
                <p className="text-white/90 pt-1">Earn certificates &amp; track XP as you grow</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="z-10 opacity-50 flex flex-col gap-2">
          <p className="text-sm">SDG 4 · Quality Education</p>
          <p className="text-sm">© 2026 COGNARA. Built for learners &amp; coaches.</p>
        </div>
      </section>

      {/* Right Panel: Auth Forms */}
      <section className="w-full lg:w-1/2 flex flex-col bg-[#fcfbf9] dark:bg-[#131313] relative overflow-y-auto px-8 py-6 min-h-screen">
        {/* Top Header Row */}
        <div className="flex w-full justify-between items-center shrink-0">
          <div className="lg:hidden flex items-center gap-2">
            <Link href="/">
              <CognaraLogo variant="icon" size={28} />
            </Link>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="w-full flex justify-center my-auto py-4">
          {children}
        </div>

        {/* Bottom Links */}
        <div className="flex justify-center gap-6 text-cn-ink-subtle text-sm shrink-0">
          <Link className="hover:text-cn-ink transition-colors" href="/legal/privacy">Privacy Policy</Link>
          <Link className="hover:text-cn-ink transition-colors" href="/legal/terms">Terms of Service</Link>
          <a className="hover:text-cn-ink transition-colors" href="mailto:support@cognara.app">Contact</a>
        </div>
      </section>
    </div>
  );
}
