import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_ID!;
export const SUBSCRIPTION_FEE_MONTHLY = 980; // 円/月
export const PAYOUT_RATE = 0.8; // 受取人への還元率
export const DEFAULT_LETTER_FEE = 310;
export const FREE_TIER_MONTHLY_LIMIT = 10;
