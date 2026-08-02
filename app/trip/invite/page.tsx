import { Avatar } from "@/components/avatar";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenHeader } from "@/components/screen-header";
import { PEOPLE, TRIP } from "@/lib/mock";

const JOINED = [
  { person: PEOPLE.me, status: "OWNER", accent: true },
  { person: PEOPLE.wei, status: "JOINED", accent: false },
  { person: PEOPLE.amber, status: "JOINED", accent: false },
];

export default function InvitePage() {
  return (
    <main className="flex flex-1 flex-col">
      <ScreenHeader backHref="/trip/new" title={TRIP.name} />

      <h1 className="px-6 pt-3.5 text-[26px] leading-[1.25] font-extrabold tracking-[-0.02em]">
        Let them scan this.
        <br />
        That&apos;s the whole invite.
      </h1>

      <div className="mx-6 mt-5 border-[1.5px] border-ink">
        <div className="flex items-center justify-center border-b-[1.5px] border-ink py-5">
          {/* QR placeholder — real code comes with the invite backend */}
          <div
            className="flex size-[150px] items-center justify-center bg-white"
            style={{
              backgroundImage: "radial-gradient(#0A0B0D 2px, transparent 2.1px)",
              backgroundSize: "13px 13px",
            }}
          >
            <div className="flex size-11 items-center justify-center bg-cobalt text-lg font-extrabold text-white">
              R
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-[13px]">
          <span className="font-mono text-xs font-medium text-ash">{TRIP.inviteUrl}</span>
          <button type="button" className="font-mono text-xs font-semibold text-cobalt">
            COPY
          </button>
        </div>
      </div>

      <div className="flex items-baseline justify-between px-6 pt-[22px] pb-2.5">
        <p className="eyebrow">Joined — {JOINED.length + 1}</p>
        <p className="font-mono text-[10px] font-medium text-silver">INCL. YOU</p>
      </div>

      <ul>
        {JOINED.map(({ person, status, accent }) => (
          <li
            key={person.id}
            className="flex items-center gap-3 border-t border-hairline px-6 py-3"
          >
            <Avatar person={person} />
            <p className="flex-1 text-[15px] leading-none font-bold">{person.name}</p>
            <p
              className={`font-mono text-[10px] font-medium tracking-[0.1em] ${
                accent ? "text-gain" : "text-silver"
              }`}
            >
              {status}
            </p>
          </li>
        ))}
        <li className="flex items-center gap-3 border-y border-hairline px-6 py-3">
          <div className="flex size-8 flex-none items-center justify-center rounded-[3px] border-[1.5px] border-dashed border-silver text-base text-ash">
            +
          </div>
          <p className="flex-1 text-[15px] leading-none font-medium text-ash">
            Add someone manually
          </p>
        </li>
      </ul>

      <div className="flex-1" />

      <div className="px-6 pb-3.5">
        <PrimaryButton href="/">Start tracking</PrimaryButton>
      </div>
    </main>
  );
}
