"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SignInWithBase } from "@/components/sign-in-with-base";

type Me = { id: string; walletAddress: string | null; displayName: string };

export default function LoginPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(({ user }) => setMe(user))
      .finally(() => setLoaded(true));
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 pt-3.5">
        <Link href="/" className="text-sm font-medium text-ash">
          ←
        </Link>
        <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-ash">
          BASE SEPOLIA
        </span>
      </div>

      <div className="px-6 pt-[22px]">
        <div className="mb-4 flex size-11 items-center justify-center bg-cobalt text-lg font-extrabold text-white">
          R
        </div>
        <h1 className="text-[26px] leading-[1.25] font-extrabold tracking-[-0.02em]">
          One account. Your key, your money.
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-ash">
          Sign in with the same passkey wallet your settlements land in. No
          password, nothing for us to hold.
        </p>
      </div>

      <div className="flex-1" />

      <div className="px-6 pb-8">
        {!loaded ? null : me ? (
          <div className="flex flex-col gap-3 border-t-[1.5px] border-ink pt-4">
            <p className="eyebrow text-ash">SIGNED IN AS</p>
            <p className="font-mono text-[13px] break-all">
              {me.walletAddress ?? me.displayName}
            </p>
            <button
              onClick={signOut}
              className="border-[1.5px] border-ink p-[15px] text-base font-semibold"
            >
              Sign out
            </button>
          </div>
        ) : (
          <SignInWithBase
            onSignedIn={() => {
              const next = new URLSearchParams(window.location.search).get(
                "next",
              );
              router.push(next && next.startsWith("/") ? next : "/");
            }}
          />
        )}
      </div>
    </main>
  );
}
