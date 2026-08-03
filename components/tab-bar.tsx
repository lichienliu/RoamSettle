import Link from "next/link";

const TABS = [
  { key: "people", label: "PEOPLE", path: "" },
  { key: "expenses", label: "EXPENSES", path: "/expenses" },
  { key: "settle", label: "SETTLE", path: "/settle" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export function TabBar({ active, tripId }: { active: TabKey; tripId: string }) {
  return (
    <nav className="border-t-[1.5px] border-ink">
      <div className="flex">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/trip/${tripId}${tab.path}`}
            aria-current={tab.key === active ? "page" : undefined}
            className={`flex-1 py-[15px] text-center font-mono text-[10px] tracking-[0.12em] ${
              tab.key === active ? "font-semibold text-ink" : "font-medium text-silver"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="flex justify-center pt-0.5 pb-2.5">
        <div className="h-[5px] w-[126px] bg-ink opacity-20" />
      </div>
    </nav>
  );
}
