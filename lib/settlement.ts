import { exponentOf } from "./currency";

/**
 * 結算引擎 — 全 BigInt(規則 #2)。
 * 匯率以分子/分母整數存(規則 §6 備註),換算只在「轉帳金額」層級做,
 * 淨額配對先在記帳幣別完成(精確、總和為零),再逐筆換成 USDC units。
 */

export const USDC_EXPONENT = 6;

/**
 * 使用者輸入的匯率("1 JPY = 0.0067 USDC")→ 整數分數 num/den。
 * "0.0067" → 67 / 10_000。小數最多 12 位,值必須 > 0。
 */
export function parseRateToFraction(
  input: string,
): { num: bigint; den: bigint } | null {
  const m = input.trim().match(/^(\d+)(?:\.(\d*))?$/);
  if (!m) return null;
  const frac = m[2] ?? "";
  if (frac.length > 12) return null;
  const num = BigInt(m[1] + frac);
  if (num <= 0n) return null;
  return { num, den: 10n ** BigInt(frac.length) };
}

/**
 * 記帳幣別 units → USDC units(四捨五入到 1 micro-USDC)。
 * usdc = amount_major × rate × 10^6
 *      = amountUnits × num × 10^(6 − baseExp) / den
 */
export function toUsdcUnits(
  amountUnits: bigint,
  num: bigint,
  den: bigint,
  baseCurrency: string,
): bigint {
  const expDiff = USDC_EXPONENT - exponentOf(baseCurrency);
  const scaledNum =
    expDiff >= 0
      ? amountUnits * num * 10n ** BigInt(expDiff)
      : amountUnits * num;
  const scaledDen = expDiff >= 0 ? den : den * 10n ** BigInt(-expDiff);
  return (scaledNum + scaledDen / 2n) / scaledDen; // round half up
}

export type Transfer = {
  debtorMemberId: string;
  creditorMemberId: string;
  amountUnits: bigint; // 記帳幣別
};

/**
 * 最少轉帳次數建議(規格 §3-6:greedy 淨額配對,不追求全域最佳解)。
 * 每輪讓最大債務人付給最大債權人,至多 n−1 筆。
 * 排序含 memberId tiebreak → 同一組淨額永遠產生同一組轉帳(確定性)。
 */
export function greedyTransfers(net: Map<string, bigint>): Transfer[] {
  const debtors: { id: string; amt: bigint }[] = [];
  const creditors: { id: string; amt: bigint }[] = [];
  for (const [id, v] of net) {
    if (v < 0n) debtors.push({ id, amt: -v });
    else if (v > 0n) creditors.push({ id, amt: v });
  }
  const byAmtDesc = (a: { id: string; amt: bigint }, b: typeof a) =>
    a.amt === b.amt ? (a.id < b.id ? -1 : 1) : a.amt > b.amt ? -1 : 1;
  debtors.sort(byAmtDesc);
  creditors.sort(byAmtDesc);

  const transfers: Transfer[] = [];
  let di = 0;
  let ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const d = debtors[di];
    const c = creditors[ci];
    const amt = d.amt < c.amt ? d.amt : c.amt;
    transfers.push({
      debtorMemberId: d.id,
      creditorMemberId: c.id,
      amountUnits: amt,
    });
    d.amt -= amt;
    c.amt -= amt;
    if (d.amt === 0n) di++;
    if (c.amt === 0n) ci++;
  }
  return transfers;
}
