import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const authId = session.metadata?.auth_id;
      if (!authId || session.mode !== "subscription") break;

      const subscriptionId = session.subscription as string;
      await adminClient
        .from("users")
        .update({
          subscription_status: "premium",
          stripe_subscription_id: subscriptionId,
        })
        .eq("auth_id", authId);
      break;
    }

    case "invoice.paid": {
      // 更新: サブスクが有効であることを確認
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
      if (!invoice.subscription) break;

      await adminClient
        .from("users")
        .update({ subscription_status: "premium" })
        .eq("stripe_subscription_id", invoice.subscription);
      break;
    }

    case "customer.subscription.deleted":
    case "customer.subscription.paused": {
      const subscription = event.data.object as Stripe.Subscription;
      await adminClient
        .from("users")
        .update({
          subscription_status: "free",
          stripe_subscription_id: null,
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
