-- ==============================================
-- KAKULETTER - Supabase Schema
-- Supabase の SQL Editor でそのまま実行してください
-- ==============================================

-- ユーザープロフィールテーブル
CREATE TABLE public.users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id         UUID        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_id      TEXT        UNIQUE NOT NULL,        -- KKL-XXXXX 形式
  real_name       TEXT        NOT NULL,
  postal_code     TEXT        NOT NULL,               -- 例: 150-0043
  prefecture      TEXT        NOT NULL,
  city            TEXT        NOT NULL,
  address_line    TEXT        NOT NULL,
  building        TEXT,                               -- 建物名・部屋番号（任意）
  email           TEXT        NOT NULL,
  is_admin        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 手紙管理テーブル
CREATE TABLE public.letters (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_display_id  TEXT        NOT NULL,          -- 受取人の display_id
  status                TEXT        NOT NULL DEFAULT 'received'
                          CHECK (status IN ('received', 'forwarded', 'delivered')),
  received_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  forwarded_at          TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  admin_notes           TEXT,                          -- 管理者メモ
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER letters_updated_at
  BEFORE UPDATE ON public.letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==============================================
-- Row Level Security (RLS)
-- ==============================================

ALTER TABLE public.users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;

-- users: 自分のプロフィールのみ読み取り可
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

-- users: 自分のプロフィールのみ更新可（display_id と is_admin は変更不可）
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- letters: 自分宛の手紙のみ読み取り可
CREATE POLICY "letters_select_own" ON public.letters
  FOR SELECT USING (
    recipient_display_id IN (
      SELECT display_id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- ※ 管理者操作（全ユーザー・全手紙の読み書き）は
--   サーバー側で service_role キーを使うため RLS ポリシー不要

-- ==============================================
-- インデックス
-- ==============================================

CREATE INDEX idx_users_auth_id        ON public.users (auth_id);
CREATE INDEX idx_users_display_id     ON public.users (display_id);
CREATE INDEX idx_letters_recipient    ON public.letters (recipient_display_id);
CREATE INDEX idx_letters_status       ON public.letters (status);
CREATE INDEX idx_letters_received_at  ON public.letters (received_at DESC);

-- ==============================================
-- マイグレーション：送信者フォーム対応 (v2)
-- Supabase の SQL Editor で実行してください
-- ==============================================

-- sender_name / sender_email カラムを追加
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS sender_name  TEXT;
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS sender_email TEXT;

-- status の CHECK 制約を更新して payment_pending を追加
ALTER TABLE public.letters DROP CONSTRAINT IF EXISTS letters_status_check;
ALTER TABLE public.letters
  ADD CONSTRAINT letters_status_check
  CHECK (status IN ('payment_pending', 'received', 'forwarded', 'delivered'));

-- デフォルトを payment_pending に変更（オンラインフォーム経由の新規登録用）
ALTER TABLE public.letters ALTER COLUMN status SET DEFAULT 'payment_pending';

-- ==============================================
-- マイグレーション：サブスクプラン対応 (v3)
-- Supabase の SQL Editor で実行してください
-- ==============================================

-- users テーブルにサブスク関連カラムを追加
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'free'
  CHECK (subscription_status IN ('free', 'premium'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS custom_id TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS custom_fee INTEGER;

-- custom_id のインデックス
CREATE INDEX IF NOT EXISTS idx_users_custom_id ON public.users (custom_id);

-- letters テーブルに手数料・精算カラムを追加
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS fee_amount INTEGER NOT NULL DEFAULT 310;
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS payout_amount INTEGER;
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS payout_status TEXT NOT NULL DEFAULT 'none'
  CHECK (payout_status IN ('none', 'pending', 'paid'));

-- payout_status のインデックス（管理者精算クエリ用）
CREATE INDEX IF NOT EXISTS idx_letters_payout_status ON public.letters (payout_status);

-- ==============================================
-- マイグレーション：決済URL・決済手段対応 (v4)
-- Supabase の SQL Editor で実行してください
-- ==============================================

-- 決済URL（PayPay QR / Stripe Checkout のリンク）
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS payment_url TEXT;

-- 決済手段（'paypay' または 'stripe'）
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'paypay'
  CHECK (payment_method IN ('paypay', 'stripe'));

-- Stripe Checkout セッションID（支払い状態の再確認用）
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- ==============================================
-- 最初の管理者を設定する方法
-- ==============================================
-- 1. ユーザーを通常登録する
-- 2. Supabase ダッシュボード > Table Editor > users テーブルで
--    該当ユーザーの is_admin を TRUE に変更する
--
-- または下記 SQL を実行（登録済みメールアドレスに変更してください）:
--
-- UPDATE public.users
-- SET is_admin = TRUE
-- WHERE email = 'admin@example.com';
