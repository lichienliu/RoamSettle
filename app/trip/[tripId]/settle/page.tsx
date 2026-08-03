"use client";

import { use } from "react";
import { TabBar } from "@/components/tab-bar";

/** 結算引擎(v0.5 第 4 塊)上線前的佔位頁。 */
export default function SettlePlaceholderPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  return (
    <main className="flex flex-1 flex-col">
      <div className="px-6 pt-[18px]">
        <p className="eyebrow">Settle up</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center">
        <div className="flex size-11 items-center justify-center border-[1.5px] border-ink font-mono text-sm font-semibold">
          04
        </div>
        <p className="text-base font-bold">Settlement is the next build.</p>
        <p className="text-xs leading-relaxed text-ash">
          Lock the ledger, set the rate, squash the debts into the fewest
          transfers, pay in USDC. It lands here.
        </p>
      </div>

      <TabBar active="settle" tripId={tripId} />
    </main>
  );
}
