"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { formatDateRange } from "@/lib/format";
import { PrimaryButton } from "@/components/primary-button";

export default function HomePage() {
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ["me"],
    queryFn: api.me,
  });
  const signedIn = !!meData?.user;
  const { data: tripsData } = useQuery({
    queryKey: ["trips"],
    queryFn: api.listTrips,
    enabled: signedIn,
  });

  if (meLoading) return <main className="flex-1" />;

  if (!signedIn) {
    return (
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 pt-3.5">
          <div className="flex items-center gap-2">
            <div className="size-3.5 bg-cobalt" />
            <span className="font-mono text-xs font-semibold tracking-[0.06em] uppercase">
              RoamSettle
            </span>
          </div>
          <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-ash">
            BASE SEPOLIA
          </span>
        </div>

        <div className="px-6 pt-14">
          <p className="eyebrow text-cobalt">TRAVEL LEDGER / USDC SETTLEMENT</p>
          <h1 className="mt-3 text-[34px] leading-[1.15] font-extrabold tracking-[-0.02em]">
            Split the trip.
            <br />
            Settle wallet to wallet.
          </h1>
          <p className="mt-4 text-[13px] leading-relaxed text-ash">
            Track expenses with friends, settle in USDC on Base. Non-custodial —
            we never touch the money.
          </p>
        </div>

        <div className="flex-1" />

        <div className="px-6 pb-3.5">
          <PrimaryButton href="/login">Sign in with Base</PrimaryButton>
        </div>
        <p className="px-8 pb-6 text-center text-[11px] leading-normal text-silver">
          Got an invite link? Just open it — no wallet needed.
        </p>
      </main>
    );
  }

  const trips = tripsData?.trips ?? [];

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 pt-3.5">
        <div className="flex items-center gap-2">
          <div className="size-3.5 bg-cobalt" />
          <span className="font-mono text-xs font-semibold tracking-[0.06em] uppercase">
            RoamSettle
          </span>
        </div>
        <Link
          href="/login"
          className="flex size-[34px] items-center justify-center bg-ink font-mono text-[11px] font-semibold text-white"
        >
          ME
        </Link>
      </div>

      <div className="flex items-baseline justify-between px-6 pt-8 pb-2.5">
        <p className="eyebrow">Your trips</p>
        <p className="font-mono text-[10px] font-medium text-ash">
          {trips.length} TOTAL
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="border-t-[1.5px] border-ink px-6 py-8">
          <p className="text-sm font-bold">No trips yet.</p>
          <p className="mt-1.5 text-xs leading-relaxed text-ash">
            Start one, share the invite link, and the ledger takes care of
            itself.
          </p>
        </div>
      ) : (
        <ul className="border-t-[1.5px] border-ink">
          {trips.map((t) => (
            <li key={t.id} className="border-b border-hairline">
              <Link
                href={`/trip/${t.id}`}
                className="flex items-center gap-3.5 px-6 py-[15px]"
              >
                <div className="flex size-[42px] flex-none items-center justify-center bg-cobalt font-mono text-[13px] font-semibold text-white">
                  {t.baseCurrency}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-base leading-none font-bold">{t.name}</p>
                  <p className="font-mono text-[10px] leading-none text-ash">
                    {formatDateRange(t.startDate, t.endDate) || "NO DATES"} ·{" "}
                    {t.memberCount} PPL
                  </p>
                </div>
                <span className="font-mono text-[10px] font-medium tracking-[0.1em] text-silver">
                  {t.status === "active" ? "OPEN" : "DONE"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex-1" />

      <div className="px-6 pb-6">
        <PrimaryButton href="/trip/new">+ New trip</PrimaryButton>
      </div>
    </main>
  );
}
