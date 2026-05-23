import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to enable Connect onboarding." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sign in as a coach before connecting payouts." }, { status: 401 });
  }

  const accountBody = new URLSearchParams({
    type: "express",
    country: "US",
    email: authData.user.email ?? "",
    "capabilities[card_payments][requested]": "true",
    "capabilities[transfers][requested]": "true",
    "metadata[user_id]": authData.user.id,
    "metadata[source]": "cognara_coach_payouts",
  });

  const accountResponse = await fetch("https://api.stripe.com/v1/accounts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: accountBody,
  });
  const account = await accountResponse.json();
  if (!accountResponse.ok) {
    return NextResponse.json(
      { error: account?.error?.message || "Stripe Connect account could not be created." },
      { status: accountResponse.status },
    );
  }

  const origin = request.nextUrl.origin;
  const linkBody = new URLSearchParams({
    account: account.id,
    type: "account_onboarding",
    refresh_url: `${origin}/coach/earnings?connect=refresh`,
    return_url: `${origin}/coach/earnings?connect=complete&account=${account.id}`,
  });

  const linkResponse = await fetch("https://api.stripe.com/v1/account_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: linkBody,
  });
  const link = await linkResponse.json();
  if (!linkResponse.ok) {
    return NextResponse.json(
      { error: link?.error?.message || "Stripe onboarding link could not be created." },
      { status: linkResponse.status },
    );
  }

  return NextResponse.json({ url: link.url, accountId: account.id });
}
