"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Avatar } from "@/components/avatar";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenHeader } from "@/components/screen-header";

export default function InvitePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const [copied, setCopied] = useState(false);
  const { data } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => api.tripDetail(tripId),
    refetchInterval: 5_000, // 朋友加入時名單即時更新
  });

  if (!data) return <main className="flex-1" />;
  const { trip, members, myMemberId } = data;
  const inviteUrl = trip.inviteToken
    ? `${window.location.origin}/join/${trip.inviteToken}`
    : null;
  const displayUrl = inviteUrl?.replace(/^https?:\/\//, "");

  async function copy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="flex flex-1 flex-col">
      <ScreenHeader backHref={`/trip/${tripId}`} title={trip.name} />

      <h1 className="px-6 pt-3.5 text-[26px] leading-[1.25] font-extrabold tracking-[-0.02em]">
        Send them this link.
        <br />
        That&apos;s the whole invite.
      </h1>

      {inviteUrl ? (
        <div className="mx-6 mt-5 border-[1.5px] border-ink">
          <div className="flex items-center justify-center border-b-[1.5px] border-ink py-5">
            <div
              className="flex size-[150px] items-center justify-center bg-white"
              style={{
                backgroundImage:
                  "radial-gradient(#0A0B0D 2px, transparent 2.1px)",
                backgroundSize: "13px 13px",
              }}
            >
              <div className="flex size-11 items-center justify-center bg-cobalt text-lg font-extrabold text-white">
                R
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-[13px]">
            <span className="truncate font-mono text-xs font-medium text-ash">
              {displayUrl}
            </span>
            <button
              type="button"
              onClick={copy}
              className={`font-mono text-xs font-semibold ${copied ? "text-gain" : "text-cobalt"}`}
            >
              {copied ? "COPIED ✓" : "COPY"}
            </button>
          </div>
        </div>
      ) : (
        <p className="px-6 pt-5 text-xs text-ash">
          Only the organizer can see the invite link.
        </p>
      )}

      <div className="flex items-baseline justify-between px-6 pt-[22px] pb-2.5">
        <p className="eyebrow">Joined — {members.length}</p>
        <p className="font-mono text-[10px] font-medium text-silver">
          INCL. YOU
        </p>
      </div>

      <ul>
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 border-t border-hairline px-6 py-3 last:border-b"
          >
            <Avatar
              person={
                m.id === myMemberId
                  ? { id: "me", name: m.nickname }
                  : { name: m.nickname }
              }
            />
            <p className="flex-1 text-[15px] leading-none font-bold">
              {m.nickname}
            </p>
            <p
              className={`font-mono text-[10px] font-medium tracking-[0.1em] ${
                m.role === "organizer" ? "text-gain" : "text-silver"
              }`}
            >
              {m.role === "organizer" ? "OWNER" : "JOINED"}
            </p>
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      <div className="px-6 pb-3.5">
        <PrimaryButton href={`/trip/${tripId}`}>Start tracking</PrimaryButton>
      </div>
    </main>
  );
}
