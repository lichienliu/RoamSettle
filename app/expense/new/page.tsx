"use client";

import Link from "next/link";
import { useState } from "react";
import { JPY_TO_TWD } from "@/lib/mock";

const CURRENCIES = ["JPY ¥", "TWD", "USD"];
const CATEGORIES = ["Transit", "Food", "Stay", "Tickets"];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export default function NewExpensePage() {
  const [digits, setDigits] = useState("12000");
  const [category, setCategory] = useState("Transit");

  const amount = Number(digits || "0");
  const twd = amount * JPY_TO_TWD;

  function press(key: string) {
    if (key === "⌫") {
      setDigits((d) => d.slice(0, -1));
    } else if (key === ".") {
      // JPY has no minor unit; ignore the decimal key for now
    } else {
      setDigits((d) => (d === "0" ? key : `${d}${key}`).slice(0, 9));
    }
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 pt-3.5">
        <Link href="/" className="text-sm font-medium text-ash">
          Cancel
        </Link>
        <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ash">
          NEW EXPENSE
        </span>
        <span className="font-mono text-[11px] font-medium text-ash">1/2</span>
      </div>

      <div className="flex border-b-[1.5px] border-ink px-6 pt-5">
        {CURRENCIES.map((code, i) => (
          <span
            key={code}
            className={`mr-6 pb-3 font-mono text-sm leading-none last:mr-0 ${
              i === 0 ? "border-b-[3px] border-cobalt font-bold" : "font-medium text-silver"
            }`}
          >
            {code}
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3.5 py-[30px] pb-6">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[26px] font-semibold text-silver">¥</span>
          <span className="tabular text-[62px] leading-none font-extrabold tracking-[-0.04em]">
            {amount.toLocaleString("en-US")}
          </span>
        </div>
        <p className="font-mono text-xs font-medium">
          <span className="text-cobalt">
            = NT${twd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
          <span className="text-silver"> · RATE {JPY_TO_TWD} · LOCKED TODAY</span>
        </p>
      </div>

      <div className="flex gap-2 overflow-hidden px-6 pb-[18px]">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`px-3.5 py-[9px] text-xs leading-none whitespace-nowrap ${
              c === category
                ? "bg-ink font-semibold text-white"
                : "border border-rule font-medium text-ash"
            }`}
          >
            {c}
          </button>
        ))}
        <span className="border border-rule px-3 py-[9px] text-xs leading-none font-medium text-ash">
          ···
        </span>
      </div>

      <div className="flex items-center justify-between border-y border-hairline px-6 py-[15px]">
        <p className="text-sm leading-none font-medium">JR travel card top-up</p>
        <p className="font-mono text-[10px] font-medium tracking-[0.1em] text-silver">NOTE</p>
      </div>

      <div className="flex-1" />

      <div className="grid grid-cols-3 px-3 py-1.5">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            className={`py-[15px] text-center font-mono ${
              key === "." || key === "⌫" ? "text-lg text-silver" : "text-2xl font-medium"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="px-6 pb-3.5">
        <Link
          href="/expense/split"
          className="block bg-cobalt p-[18px] text-center text-base font-bold text-white"
        >
          Next — who paid →
        </Link>
      </div>
    </main>
  );
}
