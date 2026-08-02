import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { PrimaryButton } from "@/components/primary-button";
import { TabBar } from "@/components/tab-bar";
import { PAIRWISE, TRIP } from "@/lib/mock";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 pt-3.5">
        <Link href="/trip/new" className="flex items-center gap-2">
          <div className="size-3.5 bg-cobalt" />
          <span className="font-mono text-xs font-semibold tracking-[0.06em] uppercase">
            {TRIP.name} ▾
          </span>
        </Link>
        <div className="flex size-[34px] items-center justify-center bg-ink font-mono text-[11px] font-semibold text-white">
          ME
        </div>
      </div>

      <header className="px-6 pt-6 pb-[22px]">
        <p className="eyebrow">You owe — trip to date</p>
        <div className="mt-3.5 flex items-baseline gap-2">
          <span className="font-mono text-[19px] font-semibold text-ash">NT$</span>
          <span className="tabular text-[58px] leading-none font-extrabold tracking-[-0.035em]">
            {TRIP.youOweTwd}
          </span>
        </div>
        <p className="mt-3.5 font-mono text-xs font-medium">
          <span className="text-cobalt">≈ {TRIP.youOweUsdc} USDC</span>
          <span className="text-ash">
            {" "}
            · {TRIP.expenseCount} expenses · {TRIP.dates.replaceAll(" — ", "–")}
          </span>
        </p>
      </header>

      <div className="h-0.5 bg-ink" />

      <div className="flex items-baseline justify-between px-6 pt-[18px] pb-2.5">
        <p className="eyebrow">Between you and them</p>
        <p className="font-mono text-[10px] font-medium text-ash">
          {PAIRWISE.length} PPL
        </p>
      </div>

      <ul>
        {PAIRWISE.map(({ person, context, amount }) => (
          <li
            key={person.id}
            className="flex items-center gap-3.5 border-b border-hairline px-6 py-[15px]"
          >
            <Avatar person={person} size="lg" />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-base leading-none font-bold">{person.name}</p>
              <p className="text-xs leading-none text-ash">{context}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="font-mono text-[9px] font-medium tracking-[0.1em] text-loss">
                YOU OWE
              </p>
              <p className="tabular font-mono text-base leading-none font-semibold">
                {amount}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      <div className="px-6 pb-3.5">
        <PrimaryButton href="/expense/new">+ Add expense</PrimaryButton>
      </div>

      <TabBar active="people" />
    </main>
  );
}
