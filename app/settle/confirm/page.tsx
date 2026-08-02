import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { PAYMENT, PEOPLE } from "@/lib/mock";

const DETAILS = [
  { label: "TO", value: `Wei · ${PAYMENT.toAddress}` },
  { label: "YOUR BALANCE", value: PAYMENT.walletBalance },
  { label: "NETWORK FEE", value: "≈ NT$0.4 · BASE", accent: true },
  { label: "ARRIVES IN", value: "~3 SECONDS" },
];

export default function ConfirmPage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 pt-3.5">
        <Link href="/settle" className="text-sm font-medium text-ash">
          Cancel
        </Link>
        <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ash">
          CONFIRM PAYMENT
        </span>
        <div className="w-10" />
      </div>

      <div className="flex flex-col items-center gap-[18px] px-6 pt-[34px] pb-[26px]">
        <div className="flex items-center gap-3.5">
          <div className="flex size-[46px] items-center justify-center rounded-[3px] bg-ink font-mono text-xs font-semibold text-white">
            ME
          </div>
          <span className="font-mono text-sm font-medium text-cobalt">→</span>
          <Avatar person={PEOPLE.wei} className="size-[46px] text-base" />
        </div>
        <p className="eyebrow">Paying Wei</p>
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex items-baseline gap-2.5">
            <span className="tabular text-[56px] leading-none font-extrabold tracking-[-0.04em]">
              {PAYMENT.usdc}
            </span>
            <span className="font-mono text-lg font-semibold text-cobalt">USDC</span>
          </div>
          <p className="font-mono text-[13px] font-medium text-ash">= NT${PAYMENT.twd}</p>
        </div>
      </div>

      <div className="border-t-[1.5px] border-ink">
        {DETAILS.map(({ label, value, accent }) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-hairline px-6 py-3.5"
          >
            <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-ash">
              {label}
            </span>
            <span className="font-mono text-xs font-medium">
              {accent ? (
                <>
                  <span className="text-gain">≈ NT$0.4</span> · BASE
                </>
              ) : (
                value
              )}
            </span>
          </div>
        ))}
      </div>

      <p className="mx-6 mt-4 text-xs leading-[1.6] text-ash">
        Once sent it lands in Wei&apos;s wallet and can&apos;t be undone — same as handing over
        cash.
      </p>

      <div className="flex-1" />

      {/* Slide-to-pay: a tap stands in for the gesture in this prototype */}
      <Link href="/settle/paid" className="mx-6 mb-4 flex h-[60px] items-center bg-cobalt p-1.5">
        <span className="flex size-12 items-center justify-center bg-white font-mono text-lg text-cobalt">
          →
        </span>
        <span className="flex-1 pr-12 text-center text-[15px] font-bold text-white">
          Slide to pay
        </span>
      </Link>
    </main>
  );
}
