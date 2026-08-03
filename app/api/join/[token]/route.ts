import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { tripMembers, trips, users } from "@/db/schema";
import { createSession, getSession } from "@/lib/session";

/** 邀請連結預覽(公開):旅程名、幣別、人數。不洩漏成員名單。 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const trip = await db.query.trips.findFirst({
    where: eq(trips.inviteToken, token),
  });
  if (!trip || trip.status !== "active") {
    return NextResponse.json({ error: "invite not found" }, { status: 404 });
  }
  const [{ memberCount }] = await db
    .select({ memberCount: sql<number>`count(*)::int` })
    .from(tripMembers)
    .where(eq(tripMembers.tripId, trip.id));

  return NextResponse.json({
    tripName: trip.name,
    baseCurrency: trip.baseCurrency,
    memberCount,
  });
}

const joinSchema = z.object({
  nickname: z.string().trim().min(1).max(40),
});

/**
 * 加入旅程(規格 §3:免錢包、免安裝)。
 * 未登入者建立匿名 user(無錢包地址)+ session;已登入者沿用身分,
 * 重複加入回傳既有成員(冪等)。
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const trip = await db.query.trips.findFirst({
    where: eq(trips.inviteToken, token),
  });
  if (!trip || trip.status !== "active") {
    return NextResponse.json({ error: "invite not found" }, { status: 404 });
  }

  const parsed = joinSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "nickname required" }, { status: 400 });
  }
  const { nickname } = parsed.data;

  const session = await getSession();
  if (session) {
    const existing = await db.query.tripMembers.findFirst({
      where: and(
        eq(tripMembers.tripId, trip.id),
        eq(tripMembers.userId, session.userId),
      ),
    });
    if (existing) {
      return NextResponse.json({ tripId: trip.id, memberId: existing.id });
    }
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });
    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 401 });
    }
    const [member] = await db
      .insert(tripMembers)
      .values({
        tripId: trip.id,
        userId: user.id,
        nickname,
        walletAddress: user.walletAddress,
      })
      .returning();
    return NextResponse.json(
      { tripId: trip.id, memberId: member.id },
      { status: 201 },
    );
  }

  // 匿名旅伴:建立無錢包 user + session,之後可在付款階段補綁錢包
  const [user] = await db
    .insert(users)
    .values({ displayName: nickname })
    .returning();
  const [member] = await db
    .insert(tripMembers)
    .values({ tripId: trip.id, userId: user.id, nickname })
    .returning();
  await createSession({ userId: user.id, address: "" });

  return NextResponse.json(
    { tripId: trip.id, memberId: member.id },
    { status: 201 },
  );
}
