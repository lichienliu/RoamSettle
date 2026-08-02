"use client";

import Link from "next/link";
import { useState } from "react";
import { createWalletClient, custom, erc20Abi } from "viem";
import { baseSepolia } from "viem/chains";
import {
  BUILDER_CODE,
  BUILDER_CODE_DATA_SUFFIX_REFERENCE,
  BUILDER_DATA_SUFFIX,
} from "@/lib/attribution";

/**
 * 歸因實驗頁(規格 §7)。不在正式導覽內,只走直接網址 /lab/attribution。
 * 目的:在 Base Sepolia 實測兩條付款路徑是否把 Builder Code 帶上鏈——
 * Path A(Base Pay pay())是未知數,Path B(viem dataSuffix)是保底方案。
 */

// builder 錢包自轉,USDC 留在原地,只消耗 gas
const RECIPIENT = "0x6b501dd4a147e7ae9bf818d7c63ef68376b4501e" as const;
// Circle 官方 USDC on Base Sepolia(6 位小數,已對 Blockscout 驗證)
const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
const BLOCKSCOUT = "https://base-sepolia.blockscout.com";
const AMOUNT_USD = "0.01";
const AMOUNT_UNITS = 10_000n; // 0.01 USDC

const SUFFIX_HEX = BUILDER_DATA_SUFFIX.slice(2).toLowerCase();
const SUFFIX_MATCHES_REFERENCE =
  BUILDER_DATA_SUFFIX.toLowerCase() ===
  BUILDER_CODE_DATA_SUFFIX_REFERENCE.toLowerCase();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function containsSuffix(input: string | null | undefined) {
  return !!input && input.toLowerCase().includes(SUFFIX_HEX);
}

type CalldataSource = {
  kind: "transaction" | "user operation";
  input: string;
  url: string;
  bundlerTxHash?: string;
};

async function fetchCalldata(hash: string): Promise<CalldataSource | null> {
  const tx = await fetch(`${BLOCKSCOUT}/api/v2/transactions/${hash}`);
  if (tx.ok) {
    const j = await tx.json();
    return {
      kind: "transaction",
      input: j.raw_input ?? "",
      url: `${BLOCKSCOUT}/tx/${hash}`,
    };
  }
  // Base Account 走 ERC-4337:hash 可能是 user operation 而非一般交易
  const op = await fetch(
    `${BLOCKSCOUT}/api/v2/proxy/account-abstraction/operations/${hash}`,
  );
  if (op.ok) {
    const j = await op.json();
    return {
      kind: "user operation",
      input: j.call_data ?? "",
      url: `${BLOCKSCOUT}/op/${hash}`,
      bundlerTxHash: j.transaction_hash ?? undefined,
    };
  }
  return null;
}

type Verdict =
  | { state: "idle" }
  | { state: "checking"; note?: string }
  | { state: "attributed"; where: string; url: string }
  | { state: "missing"; where: string; url: string }
  | { state: "not-found" };

function short(hex: string) {
  return hex.length > 18 ? `${hex.slice(0, 10)}…${hex.slice(-6)}` : hex;
}

export default function AttributionLabPage() {
  const [logA, setLogA] = useState<string[]>([]);
  const [logB, setLogB] = useState<string[]>([]);
  const [busy, setBusy] = useState<"" | "A" | "B">("");
  const [hash, setHash] = useState("");
  const [verdict, setVerdict] = useState<Verdict>({ state: "idle" });

  const pushA = (m: string) => setLogA((l) => [...l, m]);
  const pushB = (m: string) => setLogB((l) => [...l, m]);

  async function verify(target: string) {
    if (!target) return;
    setVerdict({ state: "checking" });
    // 剛送出的交易要等 Blockscout 索引,最多重試 15 次
    for (let attempt = 1; attempt <= 15; attempt++) {
      const src = await fetchCalldata(target).catch(() => null);
      if (src) {
        let attributed = containsSuffix(src.input);
        let where = src.kind;
        let url = src.url;
        if (!attributed && src.bundlerTxHash) {
          const outer = await fetchCalldata(src.bundlerTxHash).catch(() => null);
          if (outer && containsSuffix(outer.input)) {
            attributed = true;
            where = "transaction";
            url = outer.url;
          }
        }
        setVerdict(
          attributed
            ? { state: "attributed", where, url }
            : { state: "missing", where, url },
        );
        return;
      }
      setVerdict({ state: "checking", note: `waiting for indexer ${attempt}/15` });
      await sleep(3000);
    }
    setVerdict({ state: "not-found" });
  }

  async function runBasePay() {
    setBusy("A");
    setLogA([]);
    try {
      const { pay, getPaymentStatus } = await import("@base-org/account");
      pushA(`pay() ${AMOUNT_USD} USDC → self, testnet`);
      const payment = await pay({
        amount: AMOUNT_USD,
        to: RECIPIENT,
        testnet: true,
      });
      pushA(`id: ${payment.id}`);
      setHash(payment.id);
      let last = "";
      for (let i = 0; i < 20; i++) {
        const { status } = await getPaymentStatus({
          id: payment.id,
          testnet: true,
        });
        if (status !== last) {
          pushA(`status: ${status}`);
          last = status;
        }
        if (status === "completed" || status === "failed") break;
        await sleep(2000);
      }
      await verify(payment.id);
    } catch (e) {
      pushA(`error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy("");
    }
  }

  async function runViemTransfer() {
    setBusy("B");
    setLogB([]);
    try {
      const { createBaseAccountSDK } = await import("@base-org/account");
      const provider = createBaseAccountSDK({
        appName: "RoamSettle Lab",
        appChainIds: [baseSepolia.id],
      }).getProvider();
      // dataSuffix 掛在 client 層 = 未來 wagmi config 的掛法,一併驗證
      const client = createWalletClient({
        chain: baseSepolia,
        transport: custom(provider),
        dataSuffix: BUILDER_DATA_SUFFIX,
      });
      const [account] = await client.requestAddresses();
      pushB(`account: ${short(account)}`);
      pushB(`transfer ${AMOUNT_USD} USDC → self + dataSuffix`);
      const txHash = await client.writeContract({
        account,
        chain: baseSepolia,
        address: USDC_BASE_SEPOLIA,
        abi: erc20Abi,
        functionName: "transfer",
        args: [RECIPIENT, AMOUNT_UNITS],
      });
      pushB(`hash: ${txHash}`);
      setHash(txHash);
      await verify(txHash);
    } catch (e) {
      pushB(`error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="flex flex-1 flex-col pb-10">
      <div className="flex items-center justify-between px-6 pt-3.5">
        <Link href="/" className="text-sm font-medium text-ash">
          ←
        </Link>
        <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-ash">
          BASE SEPOLIA
        </span>
      </div>

      <div className="px-6 pt-[22px]">
        <p className="eyebrow text-cobalt">LAB / ATTRIBUTION</p>
        <h1 className="mt-2 text-[26px] leading-[1.25] font-extrabold tracking-[-0.02em]">
          Does the Builder Code reach the chain?
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-ash">
          Two payment paths, one question: does the transaction calldata end up
          carrying <span className="font-mono">{BUILDER_CODE}</span>? Path A is
          the unknown. Path B is the fallback.
        </p>
      </div>

      {/* 00 — suffix 編碼自檢 */}
      <section className="mt-[22px] border-t-[1.5px] border-ink">
        <div className="flex items-start gap-4 border-b border-hairline px-6 py-4">
          <span className="font-mono text-xs leading-[1.3] font-semibold text-cobalt">
            00
          </span>
          <div className="flex min-w-0 flex-col gap-[5px]">
            <div className="flex items-center gap-2">
              <p className="text-sm leading-[1.3] font-bold">Suffix encoding</p>
              <span
                className={`px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white ${
                  SUFFIX_MATCHES_REFERENCE ? "bg-gain" : "bg-loss"
                }`}
              >
                {SUFFIX_MATCHES_REFERENCE ? "MATCH" : "MISMATCH"}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-ash">
              ox/erc8021 output vs the reference shown on Base Dashboard.
            </p>
            <p className="font-mono text-[10px] leading-relaxed break-all text-silver">
              {BUILDER_DATA_SUFFIX}
            </p>
          </div>
        </div>

        {/* 01 — Base Pay */}
        <div className="flex items-start gap-4 border-b border-hairline px-6 py-4">
          <span className="font-mono text-xs leading-[1.3] font-semibold text-cobalt">
            01
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
            <p className="text-sm leading-[1.3] font-bold">Path A — Base Pay</p>
            <p className="text-xs leading-relaxed text-ash">
              pay() runs outside wagmi. Nothing guarantees it appends the
              suffix — this button answers that.
            </p>
            <button
              onClick={runBasePay}
              disabled={busy !== ""}
              className="mt-2 bg-cobalt p-[14px] text-sm font-bold text-white disabled:opacity-40"
            >
              {busy === "A" ? "WAITING FOR WALLET…" : `PAY ${AMOUNT_USD} USDC`}
            </button>
            {logA.length > 0 && (
              <div className="mt-2 flex flex-col gap-1 bg-fill p-3 font-mono text-[10px] leading-relaxed break-all text-ink">
                {logA.map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 02 — viem + dataSuffix */}
        <div className="flex items-start gap-4 border-b border-hairline px-6 py-4">
          <span className="font-mono text-xs leading-[1.3] font-semibold text-cobalt">
            02
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
            <p className="text-sm leading-[1.3] font-bold">
              Path B — viem dataSuffix
            </p>
            <p className="text-xs leading-relaxed text-ash">
              Plain USDC transfer through a wallet client that appends the
              suffix itself. This is the fallback if Path A fails.
            </p>
            <button
              onClick={runViemTransfer}
              disabled={busy !== ""}
              className="mt-2 border-[1.5px] border-ink p-[12px] text-sm font-semibold text-ink disabled:opacity-40"
            >
              {busy === "B" ? "WAITING FOR WALLET…" : `SEND ${AMOUNT_USD} USDC`}
            </button>
            {logB.length > 0 && (
              <div className="mt-2 flex flex-col gap-1 bg-fill p-3 font-mono text-[10px] leading-relaxed break-all text-ink">
                {logB.map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 03 — 鏈上驗證 */}
        <div className="flex items-start gap-4 border-b border-hairline px-6 py-4">
          <span className="font-mono text-xs leading-[1.3] font-semibold text-cobalt">
            03
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
            <p className="text-sm leading-[1.3] font-bold">Verify calldata</p>
            <p className="text-xs leading-relaxed text-ash">
              Fetches the transaction from Blockscout and scans its calldata
              for the suffix. Runs automatically after each payment.
            </p>
            <input
              value={hash}
              onChange={(e) => setHash(e.target.value.trim())}
              placeholder="0x transaction or user-op hash"
              spellCheck={false}
              className="mt-2 border border-rule p-2.5 font-mono text-[11px] outline-none focus:border-ink"
            />
            <button
              onClick={() => verify(hash)}
              disabled={!hash || verdict.state === "checking"}
              className="mt-1 border-[1.5px] border-ink p-[12px] text-sm font-semibold text-ink disabled:opacity-40"
            >
              VERIFY
            </button>

            {verdict.state === "checking" && (
              <p className="mt-2 font-mono text-[11px] text-ash">
                {verdict.note ?? "checking…"}
              </p>
            )}
            {verdict.state === "attributed" && (
              <div className="mt-2 border-l-[3px] border-gain bg-fill p-3">
                <p className="font-mono text-[11px] font-semibold text-gain">
                  ATTRIBUTED — suffix found in {verdict.where}
                </p>
                <a
                  href={verdict.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] text-cobalt underline"
                >
                  view on Blockscout ↗
                </a>
              </div>
            )}
            {verdict.state === "missing" && (
              <div className="mt-2 border-l-[3px] border-loss bg-fill p-3">
                <p className="font-mono text-[11px] font-semibold text-loss">
                  NOT FOUND — {verdict.where} calldata has no suffix
                </p>
                <a
                  href={verdict.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] text-cobalt underline"
                >
                  inspect on Blockscout ↗
                </a>
              </div>
            )}
            {verdict.state === "not-found" && (
              <p className="mt-2 font-mono text-[11px] font-semibold text-loss">
                HASH NOT FOUND — not indexed yet, or wrong network
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="px-6 pt-5">
        <p className="text-[11px] leading-normal text-silver">
          Wallet pays itself — USDC stays put, only gas is spent. Need testnet
          funds? USDC:{" "}
          <a
            href="https://faucet.circle.com"
            target="_blank"
            rel="noreferrer"
            className="text-cobalt underline"
          >
            faucet.circle.com
          </a>{" "}
          · gas ETH:{" "}
          <a
            href="https://portal.cdp.coinbase.com/products/faucet"
            target="_blank"
            rel="noreferrer"
            className="text-cobalt underline"
          >
            Coinbase faucet
          </a>{" "}
          — both on Base Sepolia, to{" "}
          <span className="font-mono break-all">{RECIPIENT}</span>
        </p>
      </div>
    </main>
  );
}
