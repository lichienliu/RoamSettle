import Link from "next/link";
import { PAYMENT, PEOPLE } from "@/lib/mock";

const SETTLED_WITH = [PEOPLE.wei, PEOPLE.amber, PEOPLE.yuki, PEOPLE.diego];

export default function PaidPage() {
  return (
    <main className="flex flex-1 flex-col bg-cobalt text-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-[22px] px-8">
        <div className="flex size-[84px] items-center justify-center bg-white font-mono text-4xl text-cobalt">
          ✓
        </div>
        <h1 className="text-center text-[30px] leading-[1.25] font-extrabold tracking-[-0.02em]">
          Sent.
          <br />
          Wei has it.
        </h1>
        <p className="font-mono text-sm font-medium">
          {PAYMENT.usdc} USDC <span className="opacity-65">· NT${PAYMENT.twd}</span>
        </p>
        <p className="border border-white/50 px-3.5 py-[9px] font-mono text-[10px] font-medium tracking-[0.1em]">
          DONE IN 2.8S · FEE NT$0.4
        </p>
      </div>

      <div className="mx-6 mb-3.5 flex flex-col gap-3 border border-white/50 p-4">
        <p className="font-mono text-[10px] font-medium tracking-[0.14em]">
          YOU&apos;RE SETTLED FOR THIS TRIP
        </p>
        <div className="flex items-center gap-[7px]">
          {SETTLED_WITH.map((person) => (
            <div
              key={person.id}
              className={`flex size-7 items-center justify-center rounded-[3px] text-xs font-bold ${
                person.id === "wei" ? "bg-white text-cobalt" : `${person.color} text-white`
              }`}
            >
              {person.initial}
            </div>
          ))}
          <p className="flex-1 text-right font-mono text-[11px] font-medium">
            {SETTLED_WITH.length}/{SETTLED_WITH.length}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-6 pb-2">
        <Link
          href="/settle/receipt"
          className="bg-white p-[17px] text-center text-base font-bold text-cobalt"
        >
          View receipt
        </Link>
        <Link
          href="/"
          className="border-[1.5px] border-white/70 p-[15px] text-center text-[15px] font-semibold"
        >
          Back to trip
        </Link>
      </div>
      <div className="pb-4" />
    </main>
  );
}
