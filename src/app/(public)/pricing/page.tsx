import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — COGNARA™",
};

type Tier = {
  name: string;
  price: string;
  desc: string;
  cta: string;
  href: string;
  accent: string;
  featured?: boolean;
};

const tiers: Tier[] = [
  {
    name: "Student",
    price: "Free",
    desc: "Core learning tools, limited AI credits, peer sessions.",
    cta: "Get started",
    href: "/register",
    accent: "border-cn-yellow/50",
  },
  {
    name: "Pro learner",
    price: "$9/mo",
    desc: "More AI credits, certificates, priority support.",
    cta: "Coming soon",
    href: "/register",
    accent: "border-cn-orange/40 ring-2 ring-cn-orange/20",
    featured: true,
  },
  {
    name: "Coach",
    price: "Revenue share",
    desc: "Publish courses, verification, earnings dashboard.",
    cta: "Apply as coach",
    href: "/register",
    accent: "border-cn-lavender/40",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-cn-orange">Pricing</p>
      <h1 className="mt-2 text-3xl font-bold text-cn-ink sm:text-4xl">Simple, transparent plans</h1>
      <p className="mt-3 max-w-xl text-cn-ink-muted">
        Stripe checkout ships in a later milestone. Tiers below match the master product direction.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`cn-card flex flex-col p-8 ${t.accent} ${t.featured ? "scale-[1.02]" : ""}`}
          >
            {t.featured ? (
              <span className="mb-3 w-fit rounded-full bg-cn-orange px-3 py-1 text-xs font-bold text-white">
                Popular
              </span>
            ) : null}
            <h2 className="text-xl font-bold text-cn-ink">{t.name}</h2>
            <p className="mt-2 text-3xl font-extrabold text-cn-orange">{t.price}</p>
            <p className="mt-4 flex-1 text-sm text-cn-ink-muted">{t.desc}</p>
            <Link
              href={t.href}
              className="mt-6 inline-flex justify-center rounded-full bg-cn-orange py-3 text-sm font-bold text-white transition hover:bg-cn-orange-hover"
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
