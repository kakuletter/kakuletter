"use client";

import { useState } from "react";
import { updateLetterStatus } from "./actions";
import { useRouter } from "next/navigation";

type Props = {
  letterId: string;
  currentStatus: string;
};

export default function LetterStatusButton({ letterId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUpdate(status: "received" | "forwarded" | "delivered") {
    setLoading(true);
    await updateLetterStatus(letterId, status);
    router.refresh();
    setLoading(false);
  }

  if (currentStatus === "delivered") return null;

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {currentStatus === "payment_pending" && (
        <button type="button" className="status-action" onClick={() => handleUpdate("received")} disabled={loading}>
          受付済みにする
        </button>
      )}
      {currentStatus === "received" && (
        <button type="button" className="status-action" onClick={() => handleUpdate("forwarded")} disabled={loading}>
          転送済みにする
        </button>
      )}
      {currentStatus === "forwarded" && (
        <button type="button" className="status-action" onClick={() => handleUpdate("delivered")} disabled={loading}>
          配達完了にする
        </button>
      )}
    </div>
  );
}
