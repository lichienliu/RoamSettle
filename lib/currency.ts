/**
 * 幣別最小單位工具 — 全字串運算,金額永不經過 JS number(規則 #2)。
 * units = 最小單位整數字串(如 TWD 2 位小數:NT$33.35 → "3335")。
 */

const CURRENCY_EXPONENT: Record<string, number> = {
  JPY: 0,
  KRW: 0,
  TWD: 2,
  USD: 2,
  EUR: 2,
};

export const SUPPORTED_CURRENCIES = ["TWD", "JPY", "USD", "EUR", "KRW"] as const;

export const CURRENCY_SYMBOL: Record<string, string> = {
  TWD: "NT$",
  JPY: "¥",
  USD: "$",
  EUR: "€",
  KRW: "₩",
};

export function exponentOf(code: string): number {
  return CURRENCY_EXPONENT[code] ?? 2;
}

/** 使用者輸入("1234.5")→ units 字串;格式不合法回 null。 */
export function toUnits(display: string, code: string): string | null {
  const exp = exponentOf(code);
  const m = display.match(/^(\d+)(?:\.(\d*))?$/);
  if (!m) return null;
  const frac = m[2] ?? "";
  if (frac.length > exp) return null;
  const units = (m[1] + frac.padEnd(exp, "0")).replace(/^0+/, "") || "0";
  return units;
}

/** units 字串 → 顯示字串(千分位、去尾零;負數用 −)。 */
export function formatUnits(units: string, code: string): string {
  const exp = exponentOf(code);
  const neg = units.startsWith("-");
  let digits = neg ? units.slice(1) : units;
  digits = digits.padStart(exp + 1, "0");
  const int = digits.slice(0, digits.length - exp) || "0";
  const frac = (exp ? digits.slice(-exp) : "").replace(/0+$/, "");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "−" : "") + grouped + (frac ? `.${frac}` : "");
}

/** 去掉負號的絕對值 units(顯示「你欠 X」時用文字表達方向)。 */
export function absUnits(units: string): string {
  return units.replace(/^-/, "");
}
