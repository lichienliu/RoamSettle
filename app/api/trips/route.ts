import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { tripMembers, trips, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { generateInviteToken } from "@/lib/trips";

const createTripSchema = z.object({
  name: z.string().trim().min(1).max(80),
  baseCurrency: z.string().regex(/^[A-Z]{3}$/, "ISO 4217 currency code"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nickname: z.string().trim().min(1).max(40).optional(),
});

/** 建立旅程;發起人需要錢包登入(規格 §3),自動成為 organizer 成員。 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "sign in required" }, { status: 401 });
  }

  const parsed = createTripSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid input" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 401 });
  }

  const tripId = randomUUID();
  const inviteToken = generateInviteToken();
  // 兩筆 insert 走 batch(單一 transaction),不留孤兒 trip
  await db.batch([
    db.insert(trips).values({
      id: tripId,
      name: input.name,
      baseCurrency: input.baseCurrency,
      startDate: input.startDate,
      endDate: input.endDate,
      creatorUserId: user.id,
      inviteToken,
    }),
    db.insert(tripMembers).values({
      tripId,
      userId: user.id,
      nickname: input.nickname ?? user.displayName,
      walletAddress: user.walletAddress,
      role: "organizer",
    }),
  ]);

  return NextResponse.json({ id: tripId, inviteToken }, { status: 201 });
}

/** 我參與的旅程列表(含成員數)。 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "sign in required" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: trips.id,
      name: trips.name,
      baseCurrency: trips.baseCurrency,
      startDate: trips.startDate,
      endDate: trips.endDate,
      status: trips.status,
      role: tripMembers.role,
    })
    .from(tripMembers)
    .innerJoin(trips, eq(tripMembers.tripId, trips.id))
    .where(eq(tripMembers.userId, session.userId));

  const tripIds = rows.map((r) => r.id);
  const counts = tripIds.length
    ? await db
        .select({
          tripId: tripMembers.tripId,
          memberCount: sql<number>`count(*)::int`,
        })
        .from(tripMembers)
        .where(inArray(tripMembers.tripId, tripIds))
        .groupBy(tripMembers.tripId)
    : [];
  const countByTrip = new Map(counts.map((c) => [c.tripId, c.memberCount]));

  return NextResponse.json({
    trips: rows.map((r) => ({ ...r, memberCount: countByTrip.get(r.id) ?? 0 })),
  });
}
