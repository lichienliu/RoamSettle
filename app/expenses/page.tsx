import { TabBar } from "@/components/tab-bar";
import { BALANCES, EXPENSES, TRIP } from "@/lib/mock";

export default function ExpensesPage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="px-6 pt-[18px] pb-[18px]">
        <p className="eyebrow">{TRIP.name} — total spend</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-[17px] font-semibold text-ash">NT$</span>
          <span className="tabular text-[42px] leading-none font-extrabold tracking-[-0.03em]">
            {TRIP.totalSpendTwd}
          </span>
          <span className="font-mono text-xs font-medium text-silver">
            ≈ {TRIP.totalSpendJpy}
          </span>
        </div>
      </header>

      <div className="h-0.5 bg-ink" />

      <p className="eyebrow px-6 pt-4 pb-2">Where everyone stands</p>
      <div className="flex flex-col gap-2.5 px-6 pt-1 pb-[18px]">
        {BALANCES.map(({ label, amount, pct, positive }) => (
          <div key={label} className="flex items-center gap-2.5">
            <span
              className={`w-11 font-mono text-[11px] ${label === "YOU" ? "font-semibold" : "font-medium"}`}
            >
              {label}
            </span>
            <div className={`flex h-4 flex-1 bg-fill ${positive ? "" : "justify-end"}`}>
              <div
                className={`h-4 ${positive ? "bg-cobalt" : "bg-loss"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className={`tabular w-14 text-right font-mono text-xs font-semibold ${
                positive ? "text-cobalt" : "text-loss"
              }`}
            >
              {amount}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-baseline justify-between border-t-[1.5px] border-ink px-6 pt-3.5 pb-2.5">
        <p className="eyebrow">Expenses — {TRIP.expenseCount}</p>
        <p className="font-mono text-[10px] font-medium text-cobalt">BY DATE</p>
      </div>

      <ul>
        {EXPENSES.map((expense) => (
          <li
            key={expense.title}
            className={`flex items-center gap-3 border-t border-hairline px-6 py-[13px] ${
              expense.highlight ? "bg-cobalt-wash" : ""
            }`}
          >
            <div
              className={`flex size-[34px] flex-none items-center justify-center font-mono text-[9px] font-medium ${
                expense.highlight ? "bg-cobalt text-white" : "border border-rule text-ash"
              }`}
            >
              {expense.tag}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm leading-none font-bold">{expense.title}</p>
              <p
                className={`text-[11px] leading-none ${
                  expense.highlight ? "text-cobalt" : "text-ash"
                }`}
              >
                {expense.byline}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="tabular font-mono text-[13px] leading-none font-semibold">
                {expense.twd}
              </p>
              <p className="font-mono text-[10px] leading-none text-silver">
                {expense.original}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      <TabBar active="expenses" />
    </main>
  );
}
