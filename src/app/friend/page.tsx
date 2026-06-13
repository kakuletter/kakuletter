import { redirect } from "next/navigation";

// 友達向けトップはホーム（/）に統合されたため、旧URLはリダイレクトする
export default function FriendRedirect() {
  redirect("/");
}
