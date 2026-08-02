import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { TabBar } from "@/components/tab-bar";
import { OTHER_TRANSFERS, PAYMENT, PEOPLE } from "@/lib/mock";

export default function SettlePage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="px-6 pt-3.5 pb-4">
        <p className="eyebrow">Trip over — Apr 15</p>
        <h1 className="mt-2.5 text-[27px] leading-[1.2] font-extrabold tracking-[-0.02em]">
          Four transfers and everyone&apos;s square.
        </h1>
      </header>

      <div className="flex flex-col gap-[9px] border-t border-hairline px-6 py-3.5">
        <p className="text-[13px] leading-none font-bold">Why not eleven?</p>
        <p className="text-xs leading-relaxed text-ash">
          You owed four people, Diego owed four — most of it cancels out. We kept only the
          money that has to move.
        </p>
        <p className="font-mono text-[11px] font-semibold">
          <span className="text-silver">11 DEBTS</span>
          <span className="text-cobalt"> → 4 TRANSFERS</span>
          <span className="text-gain"> · SAME TOTALS</span>
        </p>
      </div>

      <p className="eyebrow border-t-[1.5px] border-ink px-6 pt-3.5 pb-2.5">
        Your transfer — 1 of 4
      </p>

      <div className="mx-6 flex flex-col gap-3.5 bg-ink p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex size-[38px] items-center justify-center rounded-[3px] bg-white font-mono text-[11px] font-semibold text-ink">
            ME
          </div>
          <div className="h-px flex-1 bg-darkline" />
          <span className="font-mono text-[13px] font-medium text-periwinkle">→</span>
          <div className="h-px flex-1 bg-darkline" />
          <Avatar person={PEOPLE.wei} className="size-[38px] text-sm" />
        </div>
        <div className="flex items-baseline gap-2.5">
          <span className="tabular text-[32px] leading-none font-extrabold tracking-[-0.03em]">
            NT${PAYMENT.twd}
          </span>
          <span className="font-mono text-xs font-medium text-periwinkle">
            ≈ {PAYMENT.usdc} USDC
          </span>
        </div>
        <p className="text-xs leading-relaxed text-silver">
          One payment to Wei clears your share with Wei, Yuki, Amber and Diego.
        </p>
        <Link
          href="/settle/wallet"
          className="bg-cobalt p-[15px] text-center text-[15px] font-bold text-white"
        >
          Pay Wei in USDC
        </Link>
      </div>

      <p className="eyebrow px-6 pt-[18px] pb-2.5">Between the others</p>
      <ul>
        {OTHER_TRANSFERS.map(({ from, to, label, amount }) => (
          <li
            key={label}
            className="flex items-center gap-3 border-t border-hairline px-6 py-3 last:border-b"
          >
            <Avatar person={from} size="sm" />
            <span className="font-mono text-[11px] font-medium text-silver">→</span>
            <Avatar person={to} size="sm" />
            <p className="flex-1 text-[13px] leading-none font-medium text-ash">{label}</p>
            <p className="tabular font-mono text-[13px] leading-none font-semibold">{amount}</p>
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      <TabBar active="settle" />
    </main>
  );
}
