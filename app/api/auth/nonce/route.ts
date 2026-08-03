import { lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateSiweNonce } from "viem/siwe";
import { db } from "@/db";
import { siweNonces } from "@/db/schema";

const NONCE_TTL_MS = 5 * 60 * 1000;

/** 發放一次性 nonce(規則 #5 第一步)。順手清掉過期的。 */
export async function POST() {
  const nonce = generateSiweNonce();
  await db.delete(siweNonces).where(lt(siweNonces.expiresAt, new Date()));
  await db.insert(siweNonces).values({
    nonce,
    expiresAt: new Date(Date.now() + NONCE_TTL_MS),
  });
  return NextResponse.json({ nonce });
}
