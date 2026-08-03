"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { splitEqually } from "@/lib/balances";
import {
  CURRENCY_SYMBOL,
  exponentOf,
  formatUnits,
  toUnits,
} from "@/lib/currency";
import { Avatar } from "@/components/avatar";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export default function NewExpensePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => api.tripDetail(tripId),
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [digits, setDigits] = useState("");
  const [title, setTitle] = useState("");
  const [payer, setPayer] = useState<string | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const save = useMutation({
    mutationFn: (body: {
      title: string;
      amountUnits: string;
      payerMemberId: string;
      shareMemberIds: string[];
    }) => api.addExpense(tripId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      router.push(`/trip/${tripId}/expenses`);
    },
  });

  if (!data) return <main className="flex-1" />;
  const { trip, members, myMemberId } = data;
  const currency = trip.baseCurrency;
  const symbol = CURRENCY_SYMBOL[currency] ?? currency;
  const exponent = exponentOf(currency);

  const units = toUnits(digits === "" || digits === "." ? "0" : digits, currency);
  const validAmount = units !== null && units !== "0";
  const payerId = payer ?? myMemberId;
  const includedIds = members.map((m) => m.id).filter((id) => !excluded.has(id));

  function press(key: string) {
    setDigits((d) => {
      if (key === "⌫") return d.slice(0, -1);
      if (key === ".") {
        if (exponent === 0 || d.includes(".")) return d;
        return d === "" ? "0." : `${d}.`;
      }
      const [int = "", frac] = d.split(".");
      if (frac !== undefined) {
        return frac.length >= exponent ? d : `${d}${key}`;
      }
      if (int.length >= 9) return d;
      return d === "0" ? key : `${d}${key}`;
    });
  }

  function toggle(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next.size === members.length ? prev : next; // 至少留一人
    });
  }

  const perHead =
    validAmount && includedIds.length > 0
      ? splitEqually(BigInt(units), includedIds)
      : null;
  const minShare = perHead
    ? [...perHead.values()].reduce((a, b) => (a < b ? a : b))
    : 0n;
  const perHeadLabel = perHead
    ? `${symbol}${formatUnits(minShare.toString(), currency)}`
    : "—";

  if (step === 1) {
    const displayInt = (digits.split(".")[0] || "0").replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ",",
    );
    const displayFrac = digits.includes(".") ? `.${digits.split(".")[1]}` : "";
    return (
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 pt-3.5">
          <Link href={`/trip/${tripId}`} className="text-sm font-medium text-ash">
            Cancel
          </Link>
          <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ash">
            NEW EXPENSE
          </span>
          <span className="font-mono text-[11px] font-medium text-ash">1/2</span>
        </div>

        <div className="flex border-b-[1.5px] border-ink px-6 pt-5">
          <span className="mr-6 border-b-[3px] border-cobalt pb-3 font-mono text-sm leading-none font-bold">
            {currency} {symbol}
          </span>
        </div>

        <div className="flex flex-col items-center gap-3.5 py-[30px] pb-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[26px] font-semibold text-silver">
              {symbol}
            </span>
            <span className="tabular text-[62px] leading-none font-extrabold tracking-[-0.04em]">
              {displayInt}
              {displayFrac}
            </span>
          </div>
          <p className="font-mono text-xs font-medium text-silver">
            LOGGED IN {currency} · SETTLES IN USDC LATER
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 border-y border-hairline px-6 py-[15px]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What was it? (ramen, taxi…)"
            maxLength={120}
            className="flex-1 text-sm leading-none font-medium outline-none placeholder:text-silver"
          />
          <p className="font-mono text-[10px] font-medium tracking-[0.1em] text-silver">
            NOTE
          </p>
        </div>

        <div className="flex-1" />

        <div className="grid grid-cols-3 px-3 py-1.5">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              className={`py-[15px] text-center font-mono ${
                key === "." || key === "⌫"
                  ? "text-lg text-silver"
                  : "text-2xl font-medium"
              } ${key === "." && exponent === 0 ? "opacity-30" : ""}`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="px-6 pb-3.5">
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!validAmount || title.trim() === ""}
            className="block w-full bg-cobalt p-[18px] text-center text-base font-bold text-white disabled:opacity-40"
          >
            Next — who paid →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 pt-3.5">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-sm font-medium text-ash"
        >
          ←
        </button>
        <span className="font-mono text-[10px] font-medium tracking-[0.1em] text-ash uppercase">
          {title.slice(0, 18)} · {symbol}
          {formatUnits(units!, currency)}
        </span>
        <span className="font-mono text-[11px] font-medium text-ash">2/2</span>
      </div>

      <p className="eyebrow px-6 pt-6 pb-3">Who fronted it?</p>
      <div className="flex flex-wrap gap-[9px] px-6">
        {members.map((m) => {
          const selected = m.id === payerId;
          const isMe = m.id === myMemberId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setPayer(m.id)}
              className="flex flex-col items-center gap-1.5"
            >
              <Avatar
                person={isMe ? { id: "me", name: m.nickname } : { name: m.nickname }}
                size="xl"
                className={
                  selected
                    ? "outline-2 outline-offset-2 outline-cobalt"
                    : "opacity-45"
                }
              />
              <span
                className={`font-mono text-[9px] uppercase ${
                  selected ? "font-semibold text-ink" : "font-medium text-silver"
                }`}
              >
                {isMe ? "YOU" : m.nickname.slice(0, 6)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-6 pt-[26px] pb-3">
        <p className="eyebrow">Split between</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold tracking-[0.1em]">
            EVEN SPLIT
          </span>
          <div className="flex h-[17px] w-[30px] items-center justify-end bg-cobalt p-0.5">
            <div className="size-[13px] bg-white" />
          </div>
        </div>
      </div>

      <ul>
        {members.map((m) => {
          const on = !excluded.has(m.id);
          return (
            <li key={m.id} className="border-t border-hairline last:border-b">
              <button
                type="button"
                onClick={() => toggle(m.id)}
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
                  {m.id === myMemberId ? "You" : m.nickname}
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

      {save.isError && (
        <p className="px-6 pb-2 font-mono text-[11px] text-loss">
          {save.error.message}
        </p>
      )}
      <div className="mx-6 mb-3.5 flex items-center justify-between border-t-2 border-ink py-3.5">
        <p className="font-mono text-[10px] font-medium tracking-[0.12em] text-ash">
          SPLIT {includedIds.length} WAYS
        </p>
        <p className="tabular font-mono text-[15px] leading-none font-semibold">
          {perHeadLabel} EACH
        </p>
      </div>
      <div className="px-6 pb-3.5">
        <button
          type="button"
          disabled={save.isPending}
          onClick={() =>
            save.mutate({
              title: title.trim(),
              amountUnits: units!,
              payerMemberId: payerId,
              shareMemberIds: includedIds,
            })
          }
          className="block w-full bg-cobalt p-[18px] text-center text-base font-bold text-white disabled:opacity-40"
        >
          {save.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </main>
  );
}
