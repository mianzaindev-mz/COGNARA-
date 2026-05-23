import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CREDIT_PACKS: Record<string, { credits: number; amountCents: number; label: string }> = {
  starter: { credits: 100, amountCents: 199, label: "Starter AI Credits" },
  plus: { credits: 500, amountCents: 799, label: "Plus AI Credits" },
  pro: { credits: 2000, amountCents: 2499, label: "Pro AI Credits" },
  max: { credits: 10000, amountCents: 9999, label: "Max AI Credits" },
};

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to enable checkout." },
      { status: 503 },
    );
  }

  const { packId } = await request.json().catch(() => ({ packId: null }));
  const pack = typeof packId === "string" ? CREDIT_PACKS[packId] : null;
  if (!pack) {
    return NextResponse.json({ error: "Unknown credit pack." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sign in before purchasing credits." }, { status: 401 });
  }

  const origin = request.nextUrl.origin;
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${origin}/billing?checkout=success`,
    cancel_url: `${origin}/billing?checkout=cancelled`,
    client_reference_id: authData.user.id,
    customer_email: authData.user.email ?? "",
    "metadata[purpose]": "ai_credit_topup",
    "metadata[user_id]": authData.user.id,
    "metadata[pack_id]": packId,
    "metadata[credits]": String(pack.credits),
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(pack.amountCents),
    "line_items[0][price_data][product_data][name]": pack.label,
    "line_items[0][price_data][product_data][description]": `${pack.credits.toLocaleString()} COGNARA AI credits`,
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json(
      { error: data?.error?.message || "Stripe checkout could not be created." },
      { status: response.status },
    );
  }

  return NextResponse.json({ url: data.url });
}
