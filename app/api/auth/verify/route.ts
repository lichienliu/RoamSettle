import { and, eq, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { parseSiweMessage, validateSiweMessage } from "viem/siwe";
import { db } from "@/db";
import { siweNonces, users } from "@/db/schema";
import { chain, publicClient } from "@/lib/chain";
import { createSession } from "@/lib/session";

/**
 * SIWE 驗證(規則 #5):驗 nonce → 驗訊息欄位 → 鏈上驗簽 → 建 session。
 * 任何一關失敗都不得建立登入狀態。
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = body?.message;
  const signature = body?.signature;
  if (typeof message !== "string" || typeof signature !== "string") {
    return NextResponse.json(
      { error: "message and signature required" },
      { status: 400 },
    );
  }

  const fields = parseSiweMessage(message);
  if (!fields.address || !fields.nonce) {
    return NextResponse.json({ error: "malformed siwe message" }, { status: 400 });
  }

  // nonce 必須是後端發的、未過期;用過即刪(單次有效,防重放)
  const consumed = await db
    .delete(siweNonces)
    .where(
      and(
        eq(siweNonces.nonce, fields.nonce),
        gt(siweNonces.expiresAt, new Date()),
      ),
    )
    .returning();
  if (consumed.length === 0) {
    return NextResponse.json(
      { error: "invalid or expired nonce" },
      { status: 401 },
    );
  }

  // domain 必須是本站、時間窗有效、鏈必須是目前的鏈
  const host = req.headers.get("host") ?? "";
  if (
    !validateSiweMessage({ message: fields, domain: host }) ||
    fields.chainId !== chain.id
  ) {
    return NextResponse.json({ error: "invalid siwe message" }, { status: 401 });
  }

  // 鏈上驗簽(ERC-6492/1271;passkey 智慧錢包不能用離線 ecrecover)
  const signatureValid = await publicClient.verifyMessage({
    address: fields.address,
    message,
    signature: signature as `0x${string}`,
  });
  if (!signatureValid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // 首次登入建立 user;地址一律小寫存,display name 先用縮寫地址
  const address = fields.address.toLowerCase();
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
