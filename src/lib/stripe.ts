import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export const PAYOUT_RATE = 0.8; // 受取人への還元率
export const DEFAULT_LETTER_FEE = 310;

// カスタムID宛の手数料を運営と受取人で分配する。
// 運営: 310円(固定) + 超過分の20%、受取人: 残り（= 超過分の80%）
// operatorCut + payoutAmount === fee を厳密に保証する（端数で1円も消えない）。
export function calculateSplit(fee: number): { operatorCut: number; payoutAmount: number } {
  const excess = Math.max(0, fee - DEFAULT_LETTER_FEE);
  const operatorCut = DEFAULT_LETTER_FEE + Math.floor(excess * (1 - PAYOUT_RATE));
  const payoutAmount = fee - operatorCut;
  return { operatorCut, payoutAmount };
}

// Connect 連結アカウントが送金を受け取れる状態か確認する。
// （オンボーディング完了済み・transfers 有効・payouts 有効）
export async function isConnectAccountReady(accountId: string): Promise<boolean> {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account.payouts_enabled === true && account.capabilities?.transfers === "active";
  } catch {
    return false;
  }
}
