import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { expenseShares, expenses, tripMembers } from "@/db/schema";
import { getSession } from "@/lib/session";
import { findMembership } from "@/lib/trips";

export const expenseInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  // 金額走字串進來,後端轉 BigInt(規則 #2:不經手 JS number)
  amountUnits: z.string().regex(/^[1-9]\d{0,17}$/, "positive integer units"),
  payerMemberId: z.uuid(),
  shareMemberIds: z.array(z.uuid()).min(1).max(64),
  occurredAt: z.iso.datetime({ offset: true }).optional(),
});

/** 記一筆帳。付款人與分攤名單都必須是本旅程成員。 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "sign in required" }, { status: 401 });
  }
  const { tripId } = await params;

  const membership = await findMembership(tripId, session.userId);
  if (!membership) {
    return NextResponse.json({ error: "not a member" }, { status: 403 });
  }

  const parsed = expenseInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid input" },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const shareIds = [...new Set(input.shareMemberIds)];

  // payer 與所有分攤者必須是本旅程成員
  const referenced = [...new Set([input.payerMemberId, ...shareIds])];
  const validMembers = await db
    .select({ id: tripMembers.id })
    .from(tripMembers)
    .where(inArray(tripMembers.id, referenced));
  const validIds = new Set(validMembers.map((m) => m.id));
  const allInTrip = await db.query.tripMembers.findMany({
    where: eq(tripMembers.tripId, tripId),
    columns: { id: true },
  });
  const tripMemberIds = new Set(allInTrip.map((m) => m.id));
  if (!referenced.every((id) => validIds.has(id) && tripMemberIds.has(id))) {
    return NextResponse.json(
      { error: "payer/share members must belong to this trip" },
      { status: 400 },
    );
  }

  const expenseId = randomUUID();
  await db.batch([
    db.insert(expenses).values({
      id: expenseId,
      tripId,
      payerMemberId: input.payerMemberId,
      title: input.title,
      amountUnits: BigInt(input.amountUnits),
      createdByMemberId: membership.id,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    }),
    db
      .insert(expenseShares)
      .values(shareIds.map((memberId) => ({ expenseId, memberId }))),
  ]);

  return NextResponse.json({ id: expenseId }, { status: 201 });
}
