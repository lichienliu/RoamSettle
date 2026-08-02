import Link from "next/link";
import { PrimaryButton } from "@/components/primary-button";

const POINTS = [
  {
    no: "01",
    title: "Made with email or Face ID",
    body: "No twelve words to write down, no extra app to install.",
  },
  {
    no: "02",
    title: "Only you can move it",
    body: "RoamSettle can see the numbers. It can't touch the money.",
  },
  {
    no: "03",
    title: "Paid in USDC",
    body: "1 USDC is 1 US dollar. Sent over Base, the fee is under NT$1.",
  },
];

export default function WalletSetupPage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 pt-3.5">
        <Link href="/settle" className="text-sm font-medium text-ash">
          ←
        </Link>
        <Link
          href="/settle"
          className="font-mono text-[11px] font-medium tracking-[0.1em] text-ash"
        >
          NOT NOW
        </Link>
      </div>

      <div className="px-6 pt-[22px]">
        <div className="mb-4 flex size-11 items-center justify-center bg-cobalt text-lg font-extrabold text-white">
          R
        </div>
        <h1 className="text-[26px] leading-[1.25] font-extrabold tracking-[-0.02em]">
          Money&apos;s about to move. Let&apos;s set up where it lands.
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-ash">
          An account number only you own. Payments land straight here.
        </p>
      </div>

      <ul className="mt-[22px] border-t-[1.5px] border-ink">
        {POINTS.map(({ no, title, body }) => (
          <li key={no} className="flex items-start gap-4 border-b border-hairline px-6 py-4">
            <span className="font-mono text-xs leading-[1.3] font-semibold text-cobalt">
              {no}
            </span>
            <div className="flex flex-col gap-[5px]">
              <p className="text-sm leading-[1.3] font-bold">{title}</p>
              <p className="text-xs leading-relaxed text-ash">{body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      <div className="flex flex-col gap-2 px-6 pb-2">
        <PrimaryButton href="/settle/confirm">Set mine up — 30 seconds</PrimaryButton>
        <PrimaryButton href="/settle/confirm" variant="outline">
          I already have a wallet
        </PrimaryButton>
      </div>
      <p className="px-8 pt-1 pb-3 text-center text-[11px] leading-normal text-silver">
        Or skip it and just mark it settled in cash.
      </p>
    </main>
  );
}
