/**
 * 淨餘額引擎 — 全 BigInt(規則 #2),不碰 JS number。
 * 不變量:所有人的淨額總和恆為 0。
 */

export type ExpenseForBalance = {
  payerMemberId: string;
  amountUnits: bigint;
  shareMemberIds: string[];
};

/**
 * 平均分攤。整數除法除不盡時,餘數依 memberId 字典序由前 r 位
 * 各多攤 1 個最小單位 — 規則必須確定性,同一筆帳誰多付 1 分錢
 * 不能因查詢順序而變。
 */
export function splitEqually(
  amountUnits: bigint,
  memberIds: string[],
): Map<string, bigint> {
  if (memberIds.length === 0) {
    throw new Error("split needs at least one member");
  }
  if (amountUnits <= 0n) {
    throw new Error("amount must be positive");
  }
  const n = BigInt(memberIds.length);
  const base = amountUnits / n;
  const remainder = amountUnits % n;
  const shares = new Map<string, bigint>();
  [...memberIds].sort().forEach((id, i) => {
    shares.set(id, base + (BigInt(i) < remainder ? 1n : 0n));
  });
  return shares;
}

/** 每位成員的淨額:正 = 應收,負 = 應付。 */
export function computeNetBalances(
  expenses: ExpenseForBalance[],
): Map<string, bigint> {
  const net = new Map<string, bigint>();
  const add = (id: string, v: bigint) => net.set(id, (net.get(id) ?? 0n) + v);
  for (const e of expenses) {
    add(e.payerMemberId, e.amountUnits);
    for (const [memberId, share] of splitEqually(
      e.amountUnits,
      e.shareMemberIds,
    )) {
      add(memberId, -share);
    }
  }
  return net;
}
