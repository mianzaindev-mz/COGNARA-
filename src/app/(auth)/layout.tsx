export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-16 dark:bg-[#0A0A0A]">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-[#141414]">
        {children}
      </div>
      <p className="pointer-events-none fixed bottom-4 left-0 right-0 text-center text-xs text-neutral-400">
        COGNARA™ — Where knowledge finds its place.
      </p>
    </div>
  );
}
