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
    <div className="flex gap-2">
      {currentStatus === "payment_pending" && (
        <button
          onClick={() => handleUpdate("received")}
          disabled={loading}
          className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full hover:bg-yellow-200 disabled:opacity-60"
        >
          受付済みにする
        </button>
      )}
      {currentStatus === "received" && (
        <button
          onClick={() => handleUpdate("forwarded")}
          disabled={loading}
          className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200 disabled:opacity-60"
        >
          転送済みにする
        </button>
      )}
      {currentStatus === "forwarded" && (
        <button
          onClick={() => handleUpdate("delivered")}
          disabled={loading}
          className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200 disabled:opacity-60"
        >
          配達完了にする
        </button>
      )}
    </div>
  );
}
