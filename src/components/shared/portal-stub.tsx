import Link from "next/link";

type PortalStubProps = {
  title: string;
  description?: string;
};

export function PortalStub({ title, description }: PortalStubProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="cn-card p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cn-orange">COGNARA</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-cn-ink">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-cn-ink-muted">{description}</p>
        ) : null}
      </header>
      <p className="text-sm text-cn-ink-muted">
        This surface is scaffolded for the student portal milestone. Use the{" "}
        <Link href="/dashboard" className="font-semibold text-cn-orange hover:underline">
          dashboard
        </Link>{" "}
        for navigation during the build.
      </p>
    </div>
  );
}
