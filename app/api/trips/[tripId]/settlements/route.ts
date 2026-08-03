import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  expenseShares,
  expenses,
  settlementBatches,
  settlementItems,
  settlementPayments,
  trips,
} from "@/db/schema";
import { computeNetBalances } from "@/lib/balances";
import { getSession } from "@/lib/session";
import {
  greedyTransfers,
  parseRateToFraction,
  toUsdcUnits,
} from "@/lib/settlement";
import { findMembership } from "@/lib/trips";

const lockSchema = z.object({
  // 1 記帳幣別 = rate USDC,十進位字串(如 "0.0067")
  rate: z.string().trim().min(1).max(20),
});

/**
 * 開始結算(規則 #3:鎖定快照)。organizer 限定。
 * 鎖定 = 當下未鎖帳目蓋上 batch 標記;之後的新帳進下一輪。
 */
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
  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "organizer only" }, { status: 403 });
  }

  const parsed = lockSchema.safeParse(await req.json().catch(() => null));
  const fraction = parsed.success ? parseRateToFraction(parsed.data.rate) : null;
  if (!fraction) {
    return NextResponse.json({ error: "invalid rate" }, { status: 400 });
  }

  // 一次只允許一輪未完成的結算
  const openBatch = await db.query.settlementBatches.findFirst({
    where: and(
      eq(settlementBatches.tripId, tripId),
      eq(settlementBatches.status, "open"),
    ),
  });
  if (openBatch) {
    return NextResponse.json(
      { error: "a settlement round is already open" },
      { status: 409 },
    );
  }

  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!trip) {
    return NextResponse.json({ error: "trip not found" }, { status: 404 });
  }

  // 只鎖「此刻」的未鎖帳目 — 以明確 id 清單鎖定,防止計算與蓋章之間混入新帳
  const unlocked = await db.query.expenses.findMany({
    where: and(
      eq(expenses.tripId, tripId),
      isNull(expenses.settlementBatchId),
      isNull(expenses.deletedAt),
    ),
  });
  if (unlocked.length === 0) {
    return NextResponse.json({ error: "nothing to settle" }, { status: 400 });
  }
  const expenseIds = unlocked.map((e) => e.id);

  const shares = await db.query.expenseShares.findMany({
    where: inArray(expenseShares.expenseId, expenseIds),
  });
  const sharesByExpense = new Map<string, string[]>();
  for (const s of shares) {
    const list = sharesByExpense.get(s.expenseId) ?? [];
    list.push(s.memberId);
    sharesByExpense.set(s.expenseId, list);
  }

  const net = computeNetBalances(
    unlocked.map((e) => ({
      payerMemberId: e.payerMemberId,
      amountUnits: e.amountUnits,
      shareMemberIds: sharesByExpense.get(e.id) ?? [],
    })),
  );
  const transfers = greedyTransfers(net);
  if (transfers.length === 0) {
    return NextResponse.json({ error: "already even" }, { status: 400 });
  }

  const batchId = randomUUID();
  await db.batch([
    db.insert(settlementBatches).values({
      id: batchId,
      tripId,
      fxRateNumerator: fraction.num,
      fxRateDenominator: fraction.den,
    }),
    db
      .update(expenses)
      .set({ settlementBatchId: batchId })
      .where(inArray(expenses.id, expenseIds)),
    db.insert(settlementItems).values(
      transfers.map((t) => ({
        batchId,
        debtorMemberId: t.debtorMemberId,
        creditorMemberId: t.creditorMemberId,
        amountUsdcUnits: toUsdcUnits(
          t.amountUnits,
          fraction.num,
          fraction.den,
          trip.baseCurrency,
        ),
      })),
    ),
  ]);

  return NextResponse.json({ id: batchId }, { status: 201 });
}

/** 結算輪列表(新到舊),含每筆轉帳與狀態。成員限定。 */
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

  const batches = await db.query.settlementBatches.findMany({
    where: eq(settlementBatches.tripId, tripId),
    orderBy: (b, { desc }) => [desc(b.lockedAt)],
  });
  const items = batches.length
    ? await db.query.settlementItems.findMany({
        where: inArray(
          settlementItems.batchId,
          batches.map((b) => b.id),
        ),
        orderBy: [asc(settlementItems.id)],
      })
    : [];

  // 已核銷的鏈上付款 → 附 tx hash 供前端連去區塊瀏覽器
  const payments = items.length
    ? await db.query.settlementPayments.findMany({
        where: and(
          inArray(
            settlementPayments.settlementItemId,
            items.map((i) => i.id),
          ),
          eq(settlementPayments.status, "confirmed"),
          eq(settlementPayments.settledOffline, false),
        ),
      })
    : [];
  const txByItem = new Map(
    payments.map((p) => [p.settlementItemId, p.transactionId]),
  );

  return NextResponse.json({
    batches: batches.map((b) => ({
      id: b.id,
      lockedAt: b.lockedAt,
      status: b.status,
      fxRateNumerator: b.fxRateNumerator.toString(),
      fxRateDenominator: b.fxRateDenominator.toString(),
      items: items
        .filter((i) => i.batchId === b.id)
        .map((i) => ({
          id: i.id,
          debtorMemberId: i.debtorMemberId,
          creditorMemberId: i.creditorMemberId,
          amountUsdcUnits: i.amountUsdcUnits.toString(),
          status: i.status,
          txHash: txByItem.get(i.id) ?? null,
        })),
    })),
  });
}
