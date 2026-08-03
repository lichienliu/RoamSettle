"use client";

import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type SettlementBatch } from "@/lib/api-client";
import { txExplorerUrl } from "@/lib/chain";
import { formatUnits } from "@/lib/currency";
import { Avatar } from "@/components/avatar";
import { LinkWalletButton } from "@/components/link-wallet-button";
import { PayUsdcButton } from "@/components/pay-usdc-button";
import { TabBar } from "@/components/tab-bar";

/** num/den(den 為 10 的冪)→ "0.0067" 顯示字串。 */
function rateDisplay(num: string, den: string) {
  const fracLen = den.length - 1;
  if (fracLen === 0) return num;
  const padded = num.padStart(fracLen + 1, "0");
  const int = padded.slice(0, padded.length - fracLen);
  const frac = padded.slice(-fracLen).replace(/0+$/, "");
  return frac ? `${int}.${frac}` : int;
}

export default function SettlePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const queryClient = useQueryClient();
  const [rate, setRate] = useState("");

  const { data: detail } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => api.tripDetail(tripId),
  });
  const { data: settlementData } = useQuery({
    queryKey: ["settlements", tripId],
    queryFn: () => api.settlements(tripId),
  });
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: api.me });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["settlements", tripId] });
    queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
  };
  const lock = useMutation({
    mutationFn: () => api.lockSettlement(tripId, rate.trim()),
    onSuccess: refresh,
  });
  const offline = useMutation({
    mutationFn: (itemId: string) => api.markOffline(itemId),
    onSuccess: refresh,
  });

  if (!detail || !settlementData) return <main className="flex-1" />;

  const { trip, members, myMemberId } = detail;
  const myWallet = meData?.user?.walletAddress ?? null;
  const isOrganizer =
    members.find((m) => m.id === myMemberId)?.role === "organizer";
  const nameOf = (id: string) =>
    id === myMemberId
      ? "You"
      : (members.find((m) => m.id === id)?.nickname ?? "?");
  const unsettledCount = detail.expenses.filter((e) => !e.locked).length;
  const batches = settlementData.batches;
  const openBatch = batches.find((b) => b.status === "open");

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-baseline justify-between px-6 pt-[18px] pb-3">
        <p className="eyebrow">Settle up — {trip.name}</p>
        <p className="font-mono text-[10px] font-medium text-ash">
          {trip.baseCurrency} → USDC
        </p>
      </div>

      {/* 發起新一輪(organizer & 無進行中結算) */}
      {!openBatch && (
        <section className="border-t-[1.5px] border-ink px-6 py-5">
          {unsettledCount === 0 ? (
            <p className="text-xs leading-relaxed text-ash">
              Nothing waiting to be settled. Log expenses first — they lock
              into the next round.
            </p>
          ) : isOrganizer ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-bold">
                {unsettledCount} expense{unsettledCount > 1 ? "s" : ""} ready to
                lock.
              </p>
              <p className="text-xs leading-relaxed text-ash">
                Locking freezes this batch — edits stop, the rate is fixed, and
                debts collapse into the fewest transfers. New expenses start the
                next round.
              </p>
              <div className="flex items-center justify-between border-y border-hairline py-[13px]">
                <p className="font-mono text-[10px] font-medium tracking-[0.14em] text-ash">
                  1 {trip.baseCurrency} =
                </p>
                <div className="flex items-baseline gap-2">
                  <input
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="0.0067"
                    inputMode="decimal"
                    className="w-28 bg-transparent text-right font-mono text-lg font-semibold outline-none placeholder:text-silver"
                  />
                  <span className="font-mono text-xs font-semibold text-ash">
                    USDC
                  </span>
                </div>
              </div>
              {lock.isError && (
                <p className="font-mono text-[11px] text-loss">
                  {lock.error.message}
                </p>
              )}
              <button
                type="button"
                onClick={() => lock.mutate()}
                disabled={rate.trim() === "" || lock.isPending}
                className="bg-cobalt p-[16px] text-center text-base font-bold text-white disabled:opacity-40"
              >
                {lock.isPending ? "Locking…" : "Lock & settle"}
              </button>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-ash">
              {unsettledCount} expense{unsettledCount > 1 ? "s" : ""} waiting.
              The organizer locks the round and sets the rate.
            </p>
          )}
        </section>
      )}

      {/* 結算輪列表 */}
      {batches.map((batch: SettlementBatch, bi) => (
        <section key={batch.id}>
          <div className="flex items-baseline justify-between border-t-[1.5px] border-ink px-6 pt-3.5 pb-2.5">
            <p className="eyebrow">
              Round {batches.length - bi} —{" "}
              {batch.status === "open" ? "in progress" : "done"}
            </p>
            <p className="font-mono text-[10px] font-medium text-ash">
              1 {trip.baseCurrency} ={" "}
              {rateDisplay(batch.fxRateNumerator, batch.fxRateDenominator)}{" "}
              USDC
            </p>
          </div>

          <ul>
            {batch.items.map((item) => {
              const iAmDebtor = item.debtorMemberId === myMemberId;
              const iAmCreditor = item.creditorMemberId === myMemberId;
              const usdc = formatUnits(item.amountUsdcUnits, "USDC");
              const mine = iAmDebtor && item.status === "pending";
              return (
                <li
                  key={item.id}
                  className={`border-b border-hairline px-6 py-[15px] ${
                    mine ? "bg-cobalt-wash" : ""
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      person={
                        iAmDebtor
                          ? { id: "me", name: "You" }
                          : { name: nameOf(item.debtorMemberId) }
                      }
                    />
                    <div className="flex flex-1 flex-col gap-1">
                      <p className="text-sm leading-none font-bold">
                        {nameOf(item.debtorMemberId)} →{" "}
                        {nameOf(item.creditorMemberId)}
                      </p>
                      <p className="font-mono text-[10px] leading-none tracking-[0.08em] text-ash">
                        {item.status === "pending" ? (
                          "PENDING"
                        ) : item.status === "paid" ? (
                          item.txHash ? (
                            <a
                              href={txExplorerUrl(item.txHash)}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-2"
                            >
                              PAID ONCHAIN ↗
                            </a>
                          ) : (
                            "PAID ONCHAIN"
                          )
                        ) : (
                          "SETTLED OFFLINE"
                        )}
                      </p>
                    </div>
                    <p
                      className={`tabular font-mono text-base leading-none font-semibold ${
                        item.status === "pending" ? "" : "text-silver"
                      }`}
                    >
                      {usdc} <span className="text-[10px]">USDC</span>
                    </p>
                  </div>

                  {mine &&
                    (() => {
                      const recipient = members.find(
                        (m) => m.id === item.creditorMemberId,
                      )?.payoutAddress;
                      return recipient ? (
                        <PayUsdcButton
                          itemId={item.id}
                          amountUsdcUnits={item.amountUsdcUnits}
                          recipient={recipient}
                          myWallet={myWallet}
                          onDone={refresh}
                        />
                      ) : (
                        <p className="mt-3 font-mono text-[11px] leading-relaxed text-ash">
                          {nameOf(item.creditorMemberId)} hasn&apos;t linked a
                          wallet yet — USDC needs somewhere to land.
                        </p>
                      );
                    })()}
                  {iAmCreditor && item.status === "pending" && !myWallet && (
                    <LinkWalletButton
                      label="LINK WALLET TO RECEIVE USDC"
                      onLinked={refresh}
                    />
                  )}
                  {iAmCreditor && item.status === "pending" && (
                    <button
                      type="button"
                      disabled={offline.isPending}
                      onClick={() => offline.mutate(item.id)}
                      className="mt-3 w-full border-[1.5px] border-ink p-[12px] text-sm font-semibold disabled:opacity-40"
                    >
                      MARK RECEIVED — CASH / OTHER
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {batches.length === 0 && !openBatch && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-10 text-center">
          <p className="text-xs text-silver">No settlement rounds yet.</p>
        </div>
      )}

      <div className="flex-1" />
      <TabBar active="settle" tripId={tripId} />
    </main>
  );
}
