import { and, eq, inArray, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenseShares, expenses, tripMembers, trips } from "@/db/schema";
import { computeNetBalances } from "@/lib/balances";
import { getSession } from "@/lib/session";
import { findMembership } from "@/lib/trips";

/** 旅程全貌:成員、帳目(含分攤名單)、即時淨餘額。僅成員可看。 */
export async function GET(
  _req: NextRequest,
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

  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!trip) {
    return NextResponse.json({ error: "trip not found" }, { status: 404 });
  }

  const members = await db.query.tripMembers.findMany({
    where: eq(tripMembers.tripId, tripId),
  });

  const expenseRows = await db.query.expenses.findMany({
    where: and(eq(expenses.tripId, tripId), isNull(expenses.deletedAt)),
    orderBy: (e, { desc }) => [desc(e.occurredAt)],
  });

  const shareRows = expenseRows.length
    ? await db.query.expenseShares.findMany({
        where: inArray(
          expenseShares.expenseId,
          expenseRows.map((e) => e.id),
        ),
      })
    : [];
  const sharesByExpense = new Map<string, string[]>();
  for (const s of shareRows) {
    const list = sharesByExpense.get(s.expenseId) ?? [];
    list.push(s.memberId);
    sharesByExpense.set(s.expenseId, list);
  }

  const net = computeNetBalances(
    expenseRows.map((e) => ({
      payerMemberId: e.payerMemberId,
      amountUnits: e.amountUnits,
      shareMemberIds: sharesByExpense.get(e.id) ?? [],
    })),
  );

  return NextResponse.json({
    trip: {
      id: trip.id,
      name: trip.name,
      baseCurrency: trip.baseCurrency,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status,
      // 只有 organizer 拿得到邀請 token(要分享連結用)
      inviteToken: membership.role === "organizer" ? trip.inviteToken : null,
    },
    myMemberId: membership.id,
    members: members.map((m) => ({
      id: m.id,
      nickname: m.nickname,
      role: m.role,
      hasWallet: m.walletAddress !== null,
    })),
    expenses: expenseRows.map((e) => ({
      id: e.id,
      title: e.title,
      amountUnits: e.amountUnits.toString(),
      payerMemberId: e.payerMemberId,
      occurredAt: e.occurredAt,
      locked: e.settlementBatchId !== null,
      shareMemberIds: sharesByExpense.get(e.id) ?? [],
    })),
    balances: members.map((m) => ({
      memberId: m.id,
      netUnits: (net.get(m.id) ?? 0n).toString(),
    })),
  });
}
