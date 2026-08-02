"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { PEOPLE, type PersonId } from "@/lib/mock";

const MEMBERS: PersonId[] = ["me", "wei", "amber", "yuki", "diego"];
const EXPENSE_TWD = 2544; // ¥12,000 at the locked 0.212 rate

export default function SplitPage() {
  const [payer, setPayer] = useState<PersonId>("me");
  const [included, setIncluded] = useState<Record<PersonId, boolean>>({
    me: true,
    wei: true,
    amber: true,
    yuki: true,
    diego: false,
  });

  const includedIds = MEMBERS.filter((id) => included[id]);
  const perHead = includedIds.length > 0 ? EXPENSE_TWD / includedIds.length : 0;
  const perHeadLabel = `NT$${perHead.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;

  function toggle(id: PersonId) {
    setIncluded((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      return Object.values(next).some(Boolean) ? next : prev; // keep at least one
    });
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 pt-3.5">
        <Link href="/expense/new" className="text-sm font-medium text-ash">
          ←
        </Link>
        <span className="font-mono text-[10px] font-medium tracking-[0.1em] text-ash">
          JR TOP-UP · ¥12,000
        </span>
        <span className="font-mono text-[11px] font-medium text-ash">2/2</span>
      </div>

      <p className="eyebrow px-6 pt-6 pb-3">Who fronted it?</p>
      <div className="flex gap-[9px] px-6">
        {MEMBERS.map((id) => {
          const person = PEOPLE[id];
          const selected = id === payer;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPayer(id)}
              className="flex flex-col items-center gap-1.5"
            >
              <Avatar
                person={person}
                size="xl"
                className={selected ? "outline-2 outline-offset-2 outline-cobalt" : "opacity-45"}
              />
              <span
                className={`font-mono text-[9px] uppercase ${
                  selected ? "font-semibold text-ink" : "font-medium text-silver"
                }`}
              >
                {person.name === "You" ? "YOU" : person.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-6 pt-[26px] pb-3">
        <p className="eyebrow">Split between</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold tracking-[0.1em]">EVEN SPLIT</span>
          <div className="flex h-[17px] w-[30px] items-center justify-end bg-cobalt p-0.5">
            <div className="size-[13px] bg-white" />
          </div>
        </div>
      </div>

      <ul>
        {MEMBERS.map((id) => {
          const person = PEOPLE[id];
          const on = included[id];
          return (
            <li key={id} className="border-t border-hairline last:border-b">
              <button
                type="button"
                onClick={() => toggle(id)}
                className="flex w-full items-center gap-3.5 px-6 py-3.5 text-left"
              >
                {on ? (
                  <span className="flex size-5 items-center justify-center bg-ink font-mono text-[11px] font-semibold text-white">
                    ✓
                  </span>
                ) : (
                  <span className="size-5 border-[1.5px] border-rule" />
                )}
                <span
                  className={`flex-1 text-[15px] leading-none ${
                    on ? "font-bold" : "font-medium text-silver"
                  }`}
                >
                  {person.name}
                </span>
                {on ? (
                  <span className="tabular font-mono text-[13px] leading-none font-semibold">
                    {perHeadLabel}
                  </span>
                ) : (
                  <span className="font-mono text-[9px] font-medium tracking-[0.1em] text-silver">
                    WASN&apos;T THERE — EXCLUDED
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex-1" />

      <div className="mx-6 mb-3.5 flex items-center justify-between border-t-2 border-ink py-3.5">
        <p className="font-mono text-[10px] font-medium tracking-[0.12em] text-ash">
          SPLIT {includedIds.length} WAYS
        </p>
        <p className="tabular font-mono text-[15px] leading-none font-semibold">
          {perHeadLabel} EACH
        </p>
      </div>
      <div className="px-6 pb-3.5">
        <Link
          href="/expenses"
          className="block bg-cobalt p-[18px] text-center text-base font-bold text-white"
        >
          Save
        </Link>
      </div>
    </main>
  );
}
