import { and, eq, gt } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { siweNonces } from "@/db/schema";
import { chain, publicClient } from "@/lib/chain";
import { parseBaseSiweMessage } from "@/lib/siwe";

type SiweResult =
  | { address: string }
  | { error: string; status: number };

/**
 * SIWE 驗證管線(規則 #5),登入與綁定錢包共用:
 * 驗 nonce(單次有效)→ 驗訊息欄位(domain/chain 綁定)→ 鏈上驗簽。
 * 全數通過才回傳小寫地址;任何一關失敗都不得信任該地址。
 */
export async function verifySiweRequest(req: NextRequest): Promise<SiweResult> {
  const body = await req.json().catch(() => null);
  const message = body?.message;
  const signature = body?.signature;
  if (typeof message !== "string" || typeof signature !== "string") {
    return { error: "message and signature required", status: 400 };
  }

  const fields = parseBaseSiweMessage(message);
  if (!fields) {
    return { error: "malformed siwe message", status: 400 };
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
    return { error: "invalid or expired nonce", status: 401 };
  }

  // domain 綁定:訊息裡的 URI 必須指向本站(防別站騙簽後重放),
  // domain 行必須與 URI 的 hostname 一致;鏈必須是目前的鏈
  const host = req.headers.get("host") ?? "";
  let uriHost = "";
  let uriHostname = "";
  try {
    const uri = new URL(fields.uri);
    uriHost = uri.host;
    uriHostname = uri.hostname;
  } catch {
    return { error: "invalid uri", status: 401 };
  }
  if (
    uriHost !== host ||
    fields.domain !== uriHostname ||
    fields.chainId !== chain.id
  ) {
    return { error: "invalid siwe message", status: 401 };
  }

  // 鏈上驗簽(ERC-6492/1271;passkey 智慧錢包不能用離線 ecrecover)
  const signatureValid = await publicClient.verifyMessage({
    address: fields.address,
    message,
    signature: signature as `0x${string}`,
  });
  if (!signatureValid) {
    return { error: "invalid signature", status: 401 };
  }

  return { address: fields.address.toLowerCase() };
}
