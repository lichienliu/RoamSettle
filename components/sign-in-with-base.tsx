"use client";

import { useState } from "react";
import { chain } from "@/lib/chain";

type SignedInUser = { userId: string; address: string };

/**
 * Sign in with Base(SIWE)。流程(規則 #5):
 * 後端發 nonce → wallet_connect 的 signInWithEthereum 讓錢包簽 →
 * 後端驗簽建 session。前端拿到的 address 只做顯示,不做信任依據。
 */
export function SignInWithBase({
  onSignedIn,
}: {
  onSignedIn: (user: SignedInUser) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const { nonce } = await fetch("/api/auth/nonce", { method: "POST" }).then(
        (r) => r.json(),
      );

      const { createBaseAccountSDK } = await import("@base-org/account");
      const provider = createBaseAccountSDK({
        appName: "RoamSettle",
        appChainIds: [chain.id],
      }).getProvider();

      const { accounts } = (await provider.request({
        method: "wallet_connect",
        params: [
          {
            version: "1",
            capabilities: {
              signInWithEthereum: {
                nonce,
                chainId: `0x${chain.id.toString(16)}`,
              },
            },
          },
        ],
      })) as {
        accounts: {
          address: string;
          capabilities: {
            signInWithEthereum: { message: string; signature: string };
          };
        }[];
      };

      const { message, signature } =
        accounts[0].capabilities.signInWithEthereum;

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        throw new Error(error || `verify failed (${res.status})`);
      }
      onSignedIn(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={signIn}
        disabled={busy}
        className="bg-cobalt p-[18px] text-base font-bold text-white disabled:opacity-40"
      >
        {busy ? "WAITING FOR WALLET…" : "Sign in with Base"}
      </button>
      {error && (
        <p className="font-mono text-[11px] leading-relaxed text-loss">
          {error}
        </p>
      )}
    </div>
  );
}
