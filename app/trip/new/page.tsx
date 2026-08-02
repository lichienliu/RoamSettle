import { PrimaryButton } from "@/components/primary-button";
import { ScreenHeader } from "@/components/screen-header";
import { TRIP } from "@/lib/mock";

const SPEND_CURRENCIES = [
  { code: "JPY", selected: true },
  { code: "USD", selected: false },
  { code: "KRW", selected: false },
];

export default function CreateTripPage() {
  return (
    <main className="flex flex-1 flex-col">
      <ScreenHeader backHref="/" title="New trip" />

      <div className="px-6 pt-[22px] pb-6">
        <p className="eyebrow">What&apos;s this trip called?</p>
        <p className="mt-3.5 border-b-2 border-ink pb-3 text-[32px] leading-[1.15] font-extrabold tracking-[-0.02em]">
          {TRIP.name}
          <span className="font-normal text-cobalt">|</span>
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-hairline px-6 py-[18px]">
        <p className="font-mono text-[10px] font-medium tracking-[0.14em] text-ash">DATES</p>
        <p className="font-mono text-sm font-semibold">{TRIP.dates}</p>
      </div>

      <div className="flex items-center justify-between border-t border-hairline px-6 py-[18px]">
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-[10px] font-medium tracking-[0.14em] text-ash">
            BASE CURRENCY
          </p>
          <p className="text-[11px] leading-none text-silver">everything converts to this</p>
        </div>
        <p className="font-mono text-sm font-semibold">TWD — NT$</p>
      </div>

      <div className="flex flex-col gap-3.5 border-t border-hairline px-6 py-[18px]">
        <p className="font-mono text-[10px] font-medium tracking-[0.14em] text-ash">
          CURRENCIES YOU&apos;LL SPEND IN
        </p>
        <div className="flex gap-2">
          {SPEND_CURRENCIES.map(({ code, selected }) => (
            <span
              key={code}
              className={`px-4 py-2.5 font-mono text-[13px] leading-none ${
                selected
                  ? "bg-ink font-semibold text-white"
                  : "border border-rule font-medium text-ash"
              }`}
            >
              {code}
            </span>
          ))}
          <span className="border border-dashed border-rule px-4 py-2.5 font-mono text-[13px] leading-none font-medium text-silver">
            +
          </span>
        </div>
        <p className="text-xs leading-relaxed text-ash">
          We lock the rate on the day you log the expense. It never moves after that.
        </p>
      </div>

      <div className="flex-1" />

      <p className="px-6 pb-[18px] text-xs leading-[1.7] text-ash">
        <span className="font-semibold text-cobalt">No wallet needed yet.</span> We&apos;ll set
        that up at the end, when money actually has to move.
      </p>
      <div className="px-6 pb-3.5">
        <PrimaryButton href="/trip/invite">Create trip</PrimaryButton>
      </div>
    </main>
  );
}
