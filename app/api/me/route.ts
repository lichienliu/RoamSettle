import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";

/** 前端查詢目前登入狀態;未登入回 user: null(200,不是錯誤)。 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: { id: true, walletAddress: true, displayName: true },
  });
  return NextResponse.json({ user: user ?? null });
}
