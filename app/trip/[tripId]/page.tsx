"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { absUnits, CURRENCY_SYMBOL, formatUnits } from "@/lib/currency";
import { formatDateRange } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { PrimaryButton } from "@/components/primary-button";
import { TabBar } from "@/components/tab-bar";

export default function TripPeoplePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const { data, error } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => api.tripDetail(tripId),
  });

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
        <p className="font-mono text-[11px] text-loss">{error.message}</p>
        <Link href="/" className="font-mono text-xs font-semibold text-cobalt">
          ← BACK TO TRIPS
        </Link>
      </main>
    );
  }
  if (!data) return <main className="flex-1" />;

  const { trip, members, balances, expenses, myMemberId } = data;
  const symbol = CURRENCY_SYMBOL[trip.baseCurrency] ?? trip.baseCurrency;
  const netByMember = new Map(balances.map((b) => [b.memberId, b.netUnits]));
  const myNet = netByMember.get(myMemberId) ?? "0";
  const iOwe = myNet.startsWith("-");
  const others = members.filter((m) => m.id !== myMemberId);

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 pt-3.5">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-3.5 bg-cobalt" />
          <span className="font-mono text-xs font-semibold tracking-[0.06em] uppercase">
            {trip.name} ▾
          </span>
        </Link>
        <div className="flex size-[34px] items-center justify-center bg-ink font-mono text-[11px] font-semibold text-white">
          ME
        </div>
      </div>

      <header className="px-6 pt-6 pb-[22px]">
        <p className="eyebrow">
          {iOwe ? "You owe — trip to date" : "You're owed — trip to date"}
        </p>
        <div className="mt-3.5 flex items-baseline gap-2">
          <span className="font-mono text-[19px] font-semibold text-ash">
            {symbol}
          </span>
          <span className="tabular text-[58px] leading-none font-extrabold tracking-[-0.035em]">
            {formatUnits(absUnits(myNet), trip.baseCurrency)}
          </span>
        </div>
        <p className="mt-3.5 font-mono text-xs font-medium text-ash">
          {expenses.length} expenses
          {formatDateRange(trip.startDate, trip.endDate) &&
            ` · ${formatDateRange(trip.startDate, trip.endDate).replaceAll(" — ", "–")}`}
        </p>
      </header>

      <div className="h-0.5 bg-ink" />

      <div className="flex items-baseline justify-between px-6 pt-[18px] pb-2.5">
        <p className="eyebrow">Everyone&apos;s position</p>
        <p className="font-mono text-[10px] font-medium text-ash">
          {others.length} PPL
        </p>
      </div>

      <ul>
        {others.map((m) => {
          const net = netByMember.get(m.id) ?? "0";
          const owes = net.startsWith("-");
          const even = absUnits(net) === "0";
          return (
            <li
              key={m.id}
              className="flex items-center gap-3.5 border-b border-hairline px-6 py-[15px]"
            >
              <Avatar person={{ name: m.nickname }} size="lg" />
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-base leading-none font-bold">{m.nickname}</p>
                <p className="text-xs leading-none text-ash">
                  {m.hasWallet ? "Wallet connected" : "No wallet yet"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p
                  className={`font-mono text-[9px] font-medium tracking-[0.1em] ${
                    even ? "text-silver" : owes ? "text-loss" : "text-gain"
                  }`}
                >
                  {even ? "EVEN" : owes ? "OWES" : "IS OWED"}
                </p>
                <p className="tabular font-mono text-base leading-none font-semibold">
                  {formatUnits(absUnits(net), trip.baseCurrency)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex-1" />

      <div className="px-6 pb-3.5">
        <PrimaryButton href={`/trip/${tripId}/expense/new`}>
          + Add expense
        </PrimaryButton>
      </div>

      <TabBar active="people" tripId={tripId} />
    </main>
  );
}
