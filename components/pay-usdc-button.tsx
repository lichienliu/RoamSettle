"use client";

import { useState } from "react";
import { createWalletClient, custom, erc20Abi } from "viem";
import { api } from "@/lib/api-client";
import { BUILDER_DATA_SUFFIX } from "@/lib/attribution";
import { getBaseAccountProvider } from "@/lib/base-account";
import { chain, USDC_ADDRESS } from "@/lib/chain";
import { formatUnits } from "@/lib/currency";
import { LinkWalletButton } from "@/components/link-wallet-button";

type Stage = "idle" | "signing" | "verifying";

/**
 * 結算付款 = 自組 ERC-20 transfer + Builder Code dataSuffix(規格 §7,
 * 歸因實驗 Path B 驗證過的掛法;Base Pay 不帶 suffix 所以不用)。
 * 錢包回傳 hash 後交給後端核銷 — 前端回報僅是線索,入帳與否由
 * 後端查鏈決定(規則 #4)。
 */
export function PayUsdcButton({
  itemId,
  amountUsdcUnits,
  recipient,
  myWallet,
  onDone,
}: {
  itemId: string;
  amountUsdcUnits: string;
  recipient: string;
  myWallet: string | null;
  onDone: () => void;
}) {
  const [stage, setStage] = useState<Stage>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 先綁錢包才知道要從哪顆付(後端也以綁定地址驗 sender)
  if (!myWallet) {
    return <LinkWalletButton label="LINK WALLET TO PAY" onLinked={onDone} />;
  }

  async function pay() {
    setError(null);
    try {
      let hash = txHash;
      if (!hash) {
        setStage("signing");
        const provider = await getBaseAccountProvider();
        const client = createWalletClient({
          chain,
          transport: custom(provider),
          dataSuffix: BUILDER_DATA_SUFFIX,
        });
        const [account] = await client.requestAddresses();
        if (account.toLowerCase() !== myWallet) {
          throw new Error(
            `connected wallet ${account.slice(0, 6)}… is not your linked wallet`,
          );
        }
        hash = await client.writeContract({
          account,
          chain,
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipient as `0x${string}`, BigInt(amountUsdcUnits)],
        });
        // 記住 hash:上鏈已成功的話,核銷失敗只需重驗,不能重付
        setTxHash(hash);
      }
      setStage("verifying");
      await api.submitPayment(itemId, hash);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStage("idle");
    }
  }

  const label =
    stage === "signing"
      ? "CONFIRM IN WALLET…"
      : stage === "verifying"
        ? "VERIFYING ON CHAIN…"
        : txHash
          ? "RETRY VERIFICATION"
          : `PAY ${formatUnits(amountUsdcUnits, "USDC")} USDC`;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <button
        type="button"
        onClick={pay}
        disabled={stage !== "idle"}
        className="w-full bg-cobalt p-[12px] text-sm font-bold text-white disabled:opacity-40"
      >
        {label}
      </button>
      {error && (
        <p className="font-mono text-[11px] leading-relaxed text-loss">
          {error}
        </p>
      )}
    </div>
  );
}
