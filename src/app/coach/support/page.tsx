import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Support — Coach — COGNARA™" };

export default function CoachSupportPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Support</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Get help with your coach account</p>
      </section>
      <EmptyState
        icon={<span className="text-2xl">🎫</span>}
        title="No open tickets"
        description="Need help? Create a support ticket and our team will respond within 24 hours."
        action={
          <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
            Create Ticket
          </button>
        }
      />
    </div>
  );
}
