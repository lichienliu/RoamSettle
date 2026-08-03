import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/session";
import { verifySiweRequest } from "@/lib/siwe-server";

/**
 * SIWE 登入(規則 #5):驗證管線見 lib/siwe-server.ts。
 * 任何一關失敗都不得建立登入狀態。
 */
export async function POST(req: NextRequest) {
  const result = await verifySiweRequest(req);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  // 首次登入建立 user;地址一律小寫存,display name 先用縮寫地址
  const { address } = result;
  const [user] = await db
    .insert(users)
    .values({
      walletAddress: address,
      displayName: `${address.slice(0, 6)}…${address.slice(-4)}`,
    })
    .onConflictDoUpdate({
      target: users.walletAddress,
      set: { walletAddress: address }, // no-op update,為了拿回既有 row
    })
    .returning();

  await createSession({ userId: user.id, address });
  return NextResponse.json({ userId: user.id, address });
}
