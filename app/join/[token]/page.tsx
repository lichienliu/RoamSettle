"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export default function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState("");

  const { data, error } = useQuery({
    queryKey: ["invite", token],
    queryFn: () => api.invitePreview(token),
    retry: false,
  });

  const join = useMutation({
    mutationFn: () => api.join(token, nickname.trim()),
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries();
      router.push(`/trip/${tripId}`);
    },
  });

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <p className="font-mono text-[11px] text-loss">
          This invite doesn&apos;t exist — ask for a fresh link.
        </p>
      </main>
    );
  }
  if (!data) return <main className="flex-1" />;

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 pt-3.5">
        <div className="flex items-center gap-2">
          <div className="size-3.5 bg-cobalt" />
          <span className="font-mono text-xs font-semibold tracking-[0.06em] uppercase">
            RoamSettle
          </span>
        </div>
        <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-ash">
          INVITE
        </span>
      </div>

      <div className="px-6 pt-[30px]">
        <p className="eyebrow text-cobalt">YOU&apos;RE INVITED</p>
        <h1 className="mt-2 text-[30px] leading-[1.2] font-extrabold tracking-[-0.02em]">
          {data.tripName}
        </h1>
        <p className="mt-3 font-mono text-xs font-medium text-ash">
          {data.memberCount} {data.memberCount === 1 ? "PERSON" : "PPL"} IN ·
          LOGS IN {data.baseCurrency}
        </p>
        <p className="mt-4 text-[13px] leading-relaxed text-ash">
          No wallet, no app, no sign-up. A nickname is all it takes — money
          talk comes at the very end.
        </p>
      </div>

      <div className="px-6 pt-8">
        <p className="eyebrow">What should we call you?</p>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Yuki"
          maxLength={40}
          autoFocus
          className="mt-3 w-full border-b-2 border-ink pb-3 text-[28px] leading-none font-extrabold tracking-[-0.02em] outline-none placeholder:text-silver"
        />
      </div>

      <div className="flex-1" />

      {join.isError && (
        <p className="px-6 pb-2 font-mono text-[11px] text-loss">
          {join.error.message}
        </p>
      )}
      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={() => join.mutate()}
          disabled={nickname.trim() === "" || join.isPending}
          className="block w-full bg-cobalt p-[18px] text-center text-base font-bold text-white disabled:opacity-40"
        >
          {join.isPending ? "Joining…" : "Join the trip"}
        </button>
      </div>
    </main>
  );
}
