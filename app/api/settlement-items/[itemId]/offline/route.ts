import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  settlementBatches,
  settlementItems,
  settlementPayments,
  tripMembers,
} from "@/db/schema";
import { getSession } from "@/lib/session";
import { findMembership } from "@/lib/trips";

/**
 * 標記「已用其他方式結清」(規格 §3-7:現金等線下情況)。
 * 只有該筆的收款人或 organizer 能標;不經手資金,純紀錄。
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "sign in required" }, { status: 401 });
  }
  const { itemId } = await params;

  const item = await db.query.settlementItems.findFirst({
    where: eq(settlementItems.id, itemId),
  });
  if (!item) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (item.status !== "pending") {
    return NextResponse.json({ error: "already settled" }, { status: 409 });
  }

  const batch = await db.query.settlementBatches.findFirst({
    where: eq(settlementBatches.id, item.batchId),
  });
  if (!batch) {
    return NextResponse.json({ error: "batch not found" }, { status: 404 });
  }
  const membership = await findMembership(batch.tripId, session.userId);
  const isCreditor = membership?.id === item.creditorMemberId;
  const isOrganizer = membership?.role === "organizer";
  if (!isCreditor && !isOrganizer) {
    return NextResponse.json(
      { error: "only the recipient (or organizer) can mark this" },
      { status: 403 },
    );
  }

  const creditor = await db.query.tripMembers.findFirst({
    where: eq(tripMembers.id, item.creditorMemberId),
  });

  await db.batch([
    db.insert(settlementPayments).values({
      settlementItemId: item.id,
      payerAddress: "offline",
      recipientAddress: creditor?.walletAddress ?? "offline",
      expectedAmountUnits: item.amountUsdcUnits,
      settledOffline: true,
      status: "confirmed",
      confirmedAt: new Date(),
    }),
    db
      .update(settlementItems)
      .set({ status: "settled_offline" })
      .where(eq(settlementItems.id, item.id)),
  ]);

  // 這一輪全部結清 → batch 完成
  const remaining = await db.query.settlementItems.findFirst({
    where: and(
      eq(settlementItems.batchId, item.batchId),
      eq(settlementItems.status, "pending"),
      ne(settlementItems.id, item.id),
    ),
  });
  if (!remaining) {
    await db
      .update(settlementBatches)
      .set({ status: "completed" })
      .where(eq(settlementBatches.id, item.batchId));
  }

  return NextResponse.json({ ok: true });
}
