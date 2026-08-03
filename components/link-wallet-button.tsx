"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { requestSiwePayload } from "@/lib/base-account";

/**
 * 免錢包成員把 Base Account 綁到目前帳號(收付 USDC 的前置)。
 * 與登入同一套 SIWE 簽名,只是後端打 /api/auth/link 而非建新帳號。
 */
export function LinkWalletButton({
  label,
  onLinked,
}: {
  label: string;
  onLinked: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function link() {
    setBusy(true);
    setError(null);
    try {
      const { message, signature } = await requestSiwePayload();
      await api.linkWallet(message, signature);
      onLinked();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <button
        type="button"
        onClick={link}
        disabled={busy}
        className="w-full border-[1.5px] border-ink p-[12px] text-sm font-semibold disabled:opacity-40"
      >
        {busy ? "WAITING FOR WALLET…" : label}
      </button>
      {error && (
        <p className="font-mono text-[11px] leading-relaxed text-loss">
          {error}
        </p>
      )}
    </div>
  );
}
