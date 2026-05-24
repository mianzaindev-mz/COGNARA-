import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidUUID } from "@/lib/utils/uuid";

export const runtime = "nodejs";

function verifyStripeSignature(payload: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const digest = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  if (digest.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!verifyStripeSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const event = JSON.parse(payload);
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data?.object;
  const metadata = session?.metadata || {};
  if (metadata.purpose !== "ai_credit_topup") {
    return NextResponse.json({ received: true });
  }

  const userId = metadata.user_id;
  const credits = Number(metadata.credits);
  if (!userId || !Number.isFinite(credits) || credits <= 0) {
    return NextResponse.json({ error: "Invalid credit metadata." }, { status: 400 });
  }

  if (!isValidUUID(userId)) {
    return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("ai_credits")
    .select("balance, lifetime_purchased")
    .eq("user_id", userId)
    .maybeSingle();

  const balanceAfter = (current?.balance ?? 0) + credits;
  const lifetimePurchased = (current?.lifetime_purchased ?? 0) + credits;

  await supabase.from("ai_credits").upsert({
    user_id: userId,
    balance: balanceAfter,
    lifetime_purchased: lifetimePurchased,
  }, { onConflict: "user_id" });

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: credits,
    action: `Purchased ${credits} AI credits`,
    balance_after: balanceAfter,
    stripe_payment_id: session.payment_intent || session.id,
  });

  return NextResponse.json({ received: true });
}
