"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { CURRENCY_SYMBOL, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { ScreenHeader } from "@/components/screen-header";

export default function CreateTripPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("TWD");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ["me"],
    queryFn: api.me,
  });
  if (!meLoading && !meData?.user && typeof window !== "undefined") {
    router.replace("/login?next=/trip/new");
  }

  const create = useMutation({
    mutationFn: () =>
      api.createTrip({
        name: name.trim(),
        baseCurrency: currency,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      router.push(`/trip/${id}/invite`);
    },
  });

  const canCreate = name.trim().length > 0 && !create.isPending;

  return (
    <main className="flex flex-1 flex-col">
      <ScreenHeader backHref="/" title="New trip" />

      <div className="px-6 pt-[22px] pb-6">
        <p className="eyebrow">What&apos;s this trip called?</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tokyo, 5 days"
          maxLength={80}
          autoFocus
          className="mt-3.5 w-full border-b-2 border-ink pb-3 text-[32px] leading-[1.15] font-extrabold tracking-[-0.02em] outline-none placeholder:text-silver"
        />
      </div>

      <div className="flex items-center justify-between border-t border-hairline px-6 py-[15px]">
        <p className="font-mono text-[10px] font-medium tracking-[0.14em] text-ash">
          FROM
        </p>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-transparent text-right font-mono text-sm font-semibold outline-none"
        />
      </div>
      <div className="flex items-center justify-between border-t border-hairline px-6 py-[15px]">
        <p className="font-mono text-[10px] font-medium tracking-[0.14em] text-ash">
          TO
        </p>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={startDate || undefined}
          className="bg-transparent text-right font-mono text-sm font-semibold outline-none"
        />
      </div>

      <div className="flex flex-col gap-3.5 border-t border-hairline px-6 py-[18px]">
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-[10px] font-medium tracking-[0.14em] text-ash">
            BASE CURRENCY
          </p>
          <p className="text-[11px] leading-none text-silver">
            everything is logged in this — one currency per trip
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_CURRENCIES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setCurrency(code)}
              className={`px-4 py-2.5 font-mono text-[13px] leading-none ${
                code === currency
                  ? "bg-ink font-semibold text-white"
                  : "border border-rule font-medium text-ash"
              }`}
            >
              {code} {CURRENCY_SYMBOL[code]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {create.isError && (
        <p className="px-6 pb-2 font-mono text-[11px] text-loss">
          {create.error.message}
        </p>
      )}
      <p className="px-6 pb-[18px] text-xs leading-[1.7] text-ash">
        <span className="font-semibold text-cobalt">
          Friends won&apos;t need wallets.
        </span>{" "}
        They join with a link and a nickname. Wallets show up only when money
        moves.
      </p>
      <div className="px-6 pb-3.5">
        <button
          onClick={() => create.mutate()}
          disabled={!canCreate}
          className="block w-full bg-cobalt p-[18px] text-center text-base font-bold text-white disabled:opacity-40"
        >
          {create.isPending ? "Creating…" : "Create trip"}
        </button>
      </div>
    </main>
  );
}
