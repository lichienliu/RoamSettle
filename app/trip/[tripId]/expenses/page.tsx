"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { absUnits, CURRENCY_SYMBOL, formatUnits } from "@/lib/currency";
import { tagFor } from "@/lib/format";
import { PrimaryButton } from "@/components/primary-button";
import { TabBar } from "@/components/tab-bar";

export default function ExpensesPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const { data } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => api.tripDetail(tripId),
  });
  if (!data) return <main className="flex-1" />;

  const { trip, members, expenses, balances } = data;
  const symbol = CURRENCY_SYMBOL[trip.baseCurrency] ?? trip.baseCurrency;
  const nameByMember = new Map(members.map((m) => [m.id, m.nickname]));

  const total = expenses.reduce((sum, e) => sum + BigInt(e.amountUnits), 0n);

  // 淨額橫條:寬度以最大絕對值為 100%(僅視覺比例,不參與金額運算)
  const nets = balances
    .map((b) => ({ ...b, abs: BigInt(absUnits(b.netUnits)) }))
    .sort((a, b) => (a.abs === b.abs ? 0 : a.abs > b.abs ? -1 : 1));
  const maxAbs = nets[0]?.abs ?? 0n;
  const pct = (abs: bigint) =>
    maxAbs === 0n ? 0 : Number((abs * 100n) / maxAbs);

  return (
    <main className="flex flex-1 flex-col">
      <header className="px-6 pt-[18px] pb-[18px]">
        <p className="eyebrow">{trip.name} — total spend</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-[17px] font-semibold text-ash">
            {symbol}
          </span>
          <span className="tabular text-[42px] leading-none font-extrabold tracking-[-0.03em]">
            {formatUnits(total.toString(), trip.baseCurrency)}
          </span>
        </div>
      </header>

      <div className="h-0.5 bg-ink" />

      <p className="eyebrow px-6 pt-4 pb-2">Where everyone stands</p>
      <div className="flex flex-col gap-2.5 px-6 pt-1 pb-[18px]">
        {nets.map((b) => {
          const positive = !b.netUnits.startsWith("-");
          const label = (nameByMember.get(b.memberId) ?? "?")
            .slice(0, 4)
            .toUpperCase();
          return (
            <div key={b.memberId} className="flex items-center gap-2.5">
              <span className="w-11 font-mono text-[11px] font-medium">
                {label}
              </span>
              <div
                className={`flex h-4 flex-1 bg-fill ${positive ? "" : "justify-end"}`}
              >
                <div
                  className={`h-4 ${positive ? "bg-cobalt" : "bg-loss"}`}
                  style={{ width: `${pct(b.abs)}%` }}
                />
              </div>
              <span
                className={`tabular w-16 text-right font-mono text-xs font-semibold ${
                  positive ? "text-cobalt" : "text-loss"
                }`}
              >
                {positive ? "+" : "−"}
                {formatUnits(b.abs.toString(), trip.baseCurrency)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-baseline justify-between border-t-[1.5px] border-ink px-6 pt-3.5 pb-2.5">
        <p className="eyebrow">Expenses — {expenses.length}</p>
        <p className="font-mono text-[10px] font-medium text-cobalt">BY DATE</p>
      </div>

      {expenses.length === 0 ? (
        <p className="border-t border-hairline px-6 py-6 text-xs text-ash">
          Nothing logged yet. First round&apos;s on someone — write it down.
        </p>
      ) : (
        <ul>
          {expenses.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 border-t border-hairline px-6 py-[13px]"
            >
              <div className="flex size-[34px] flex-none items-center justify-center border border-rule font-mono text-[9px] font-medium text-ash">
                {tagFor(e.title)}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm leading-none font-bold">{e.title}</p>
                <p className="text-[11px] leading-none text-ash">
                  {nameByMember.get(e.payerMemberId) ?? "?"} paid · split{" "}
                  {e.shareMemberIds.length} ways
                  {e.locked ? " · locked" : ""}
                </p>
              </div>
              <p className="tabular font-mono text-[13px] leading-none font-semibold">
                {formatUnits(e.amountUnits, trip.baseCurrency)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex-1" />

      <div className="px-6 pb-3.5">
        <PrimaryButton href={`/trip/${tripId}/expense/new`}>
          + Add expense
        </PrimaryButton>
      </div>

      <TabBar active="expenses" tripId={tripId} />
    </main>
  );
}
