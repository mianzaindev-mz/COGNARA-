import Link from "next/link";

type PortalStubProps = {
  title: string;
  description?: string;
};

export function PortalStub({ title, description }: PortalStubProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5734]">COGNARA</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#151313]">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-[#151313]/60">{description}</p>
        ) : null}
      </header>
      <p className="text-sm text-[#151313]/65">
        This surface is scaffolded for the student portal milestone. Use the{" "}
        <Link href="/dashboard" className="font-semibold text-[#ff5734] hover:underline">
          dashboard
        </Link>{" "}
        for navigation during the build.
      </p>
    </div>
  );
}
