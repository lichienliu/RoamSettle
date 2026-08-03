import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, getSession } from "@/lib/session";
import { verifySiweRequest } from "@/lib/siwe-server";

/**
 * 綁定錢包到「目前登入的帳號」(免錢包加入的旅伴要收付 USDC 前必經)。
 * 走與登入完全相同的 SIWE 驗證管線 — 綁定的地址之後會被當成
 * 付款 sender 的比對基準(規則 #4),所以必須有簽名證明控制權,
 * 不能只信前端回報的地址。
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "sign in required" }, { status: 401 });
  }

  const result = await verifySiweRequest(req);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }
  const { address } = result;

  const me = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  if (!me) {
    return NextResponse.json({ error: "account not found" }, { status: 401 });
  }
  // 已綁同一顆 → 冪等成功;要換錢包是另一件事,v0.5 不開放
  if (me.walletAddress === address) {
    await createSession({ userId: me.id, address });
    return NextResponse.json({ address });
  }
  if (me.walletAddress) {
    return NextResponse.json(
      { error: "this account is already linked to a different wallet" },
      { status: 409 },
    );
  }

  // 一顆錢包只能屬於一個帳號(users.wallet_address UNIQUE)
  const taken = await db.query.users.findFirst({
    where: eq(users.walletAddress, address),
  });
  if (taken) {
    return NextResponse.json(
      { error: "this wallet is already linked to another account" },
      { status: 409 },
    );
  }

  await db.update(users).set({ walletAddress: address }).where(eq(users.id, me.id));
  await createSession({ userId: me.id, address });
  return NextResponse.json({ address });
}
