export type UserProfile = {
  id: string;
  auth_id: string;
  display_id: string;
  real_name: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line: string;
  building: string | null;
  email: string;
  is_admin: boolean;
  created_at: string;
  // サブスク
  subscription_status: "free" | "premium";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_expires_at: string | null;
  custom_id: string | null;
};

export type Letter = {
  id: string;
  recipient_display_id: string;
  sender_name: string | null;
  sender_email: string | null;
  status: "payment_pending" | "received" | "forwarded" | "delivered";
  received_at: string;
  forwarded_at: string | null;
  delivered_at: string | null;
  admin_notes: string | null;
  payment_url: string | null;
  created_at: string;
  // 手数料
  fee_amount: number;
  payout_amount: number | null;
  payout_status: "none" | "pending" | "paid";
  // 決済
  payment_method: "paypay" | "stripe";
  stripe_session_id: string | null;
};

export type ActionState = {
  error?: string;
  success?: boolean;
  data?: Record<string, unknown>;
};
