const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** "2026-08-10" → "AUG 10";兩端都有時 "AUG 10 — AUG 14"。 */
export function formatDateRange(start: string | null, end: string | null) {
  const fmt = (d: string) => {
    const [, m, day] = d.split("-");
    return `${MONTHS[Number(m) - 1]} ${Number(day)}`;
  };
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  if (start) return fmt(start);
  return "";
}

/** 帳目列表的三字母標籤(設計語彙),取標題前三個字母。 */
export function tagFor(title: string) {
  const letters = title.replace(/[^A-Za-z]/g, "").toUpperCase();
  return letters.slice(0, 3) || "EXP";
}
