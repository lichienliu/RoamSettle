import Link from "next/link";
import { ScreenHeader } from "@/components/screen-header";
import { PAYMENT, TRIP } from "@/lib/mock";

const ROWS = [
  { label: "AMOUNT THEN", value: `NT$${PAYMENT.twd}` },
  { label: "NETWORK FEE", value: "NT$0.4" },
  { label: "NETWORK", value: "BASE" },
];

export default function ReceiptPage() {
  return (
    <main className="flex flex-1 flex-col">
      <ScreenHeader
        backHref="/settle/paid"
        backLabel="←"
        title="Receipt"
        right={
          <button type="button" className="font-mono text-[11px] font-semibold text-cobalt">
            SHARE
          </button>
        }
      />

      <div className="mx-6 mt-[18px] border-[1.5px] border-ink">
        <div className="flex flex-col gap-2.5 border-b border-dashed border-silver p-[18px]">
          <p className="font-mono text-[10px] font-medium tracking-[0.1em]">
            <span className="text-gain">● COMPLETED</span>
            <span className="text-silver"> · {PAYMENT.completedAt}</span>
          </p>
          <div className="flex items-baseline gap-2">
            <span className="tabular text-[34px] leading-none font-extrabold tracking-[-0.03em]">
              {PAYMENT.usdc}
            </span>
            <span className="font-mono text-[15px] font-semibold text-ash">USDC</span>
          </div>
          <p className="text-[13px] leading-none text-ash">You → Wei · Tokyo settle-up</p>
        </div>
        <div className="px-[18px] pt-1 pb-2.5">
          {ROWS.map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between border-b border-fill py-[11px]"
            >
              <span className="font-mono text-[10px] font-medium tracking-[0.1em] text-ash">
                {label}
              </span>
              <span className="font-mono text-xs font-medium">{value}</span>
            </div>
          ))}
          <div className="flex justify-between py-[11px]">
            <span className="font-mono text-[10px] font-medium tracking-[0.1em] text-ash">
              TX
            </span>
            <span className="font-mono text-xs font-medium text-cobalt">
              {PAYMENT.txHash} ↗
            </span>
          </div>
        </div>
      </div>

      <div className="mx-6 mt-4 flex flex-col gap-[7px]">
        <p className="text-[13px] leading-none font-bold text-cobalt">
          A receipt anyone can verify
        </p>
        <p className="text-xs leading-relaxed text-ash">
          This transfer is permanently recorded on a public ledger. Neither of you has to
          trust RoamSettle — you both trust the same record.
        </p>
      </div>

      <Link
        href="/settle/receipt"
        className="mx-6 mt-4 bg-ink p-4 text-center text-sm font-semibold text-white"
      >
        View on-chain proof
      </Link>

      <div className="flex-1" />

      <div className="mx-6 mb-4 flex items-center gap-3 border-t-2 border-ink pt-3.5">
        <div className="flex size-[34px] items-center justify-center bg-gain font-mono text-base text-white">
          ✓
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[13px] leading-none font-bold">{TRIP.name} is fully settled</p>
          <p className="font-mono text-[11px] leading-none text-silver">
            4 TRANSFERS · 5 PEOPLE · NOBODY OWES ANYBODY
          </p>
        </div>
      </div>
    </main>
  );
}
