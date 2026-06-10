/* eslint-disable @typescript-eslint/no-require-imports */
// PayPay SDK は CommonJS モジュールのため require で読み込む
const PAYPAY = require("@paypayopa/paypayopa-sdk-node");

PAYPAY.Configure({
  clientId: process.env.PAYPAY_API_KEY!,
  clientSecret: process.env.PAYPAY_API_SECRET!,
  merchantId: process.env.PAYPAY_MERCHANT_ID!,
  productionMode: false, // sandbox
});

export const LETTER_FEE = 310; // 円

export async function createQRPayment(
  letterId: string,
  redirectUrl: string,
  amount: number = LETTER_FEE
): Promise<string | null> {
  const payload = {
    merchantPaymentId: letterId,
    amount: { amount, currency: "JPY" },
    codeType: "ORDER_QR",
    redirectUrl,
    redirectType: "WEB_LINK",
    orderDescription: "KAKULETTER 転送手数料",
    orderItems: [],
    metadata: null,
    expiryDate: null,
  };

  try {
    const response = await PAYPAY.QRCodeCreate(payload);
    return (response?.BODY?.data?.url as string) ?? null;
  } catch (e) {
    console.error("[PayPay] QRCodeCreate error:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

export async function getPaymentStatus(letterId: string): Promise<string | null> {
  try {
    const response = await PAYPAY.GetCodePaymentDetails([letterId]);
    return (response?.BODY?.data?.status as string) ?? null;
  } catch (e) {
    console.error("[PayPay] GetCodePaymentDetails error:", e instanceof Error ? e.message : String(e));
    return null;
  }
}
