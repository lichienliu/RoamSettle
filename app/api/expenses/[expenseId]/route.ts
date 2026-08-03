import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { expenseShares, expenses, tripMembers } from "@/db/schema";
import { getSession } from "@/lib/session";
import { findMembership } from "@/lib/trips";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  amountUnits: z.string().regex(/^[1-9]\d{0,17}$/).optional(),
  payerMemberId: z.uuid().optional(),
  shareMemberIds: z.array(z.uuid()).min(1).max(64).optional(),
  occurredAt: z.iso.datetime({ offset: true }).optional(),
});

/** 共用前置:載入帳目 + 驗成員資格 + 快照凍結檢查(規則 #3)。 */
async function loadEditable(expenseId: string, userId: string) {
  const expense = await db.query.expenses.findFirst({
    where: eq(expenses.id, expenseId),
  });
  if (!expense || expense.deletedAt) {
    return { error: NextResponse.json({ error: "not found" }, { status: 404 }) };
  }
  const membership = await findMembership(expense.tripId, userId);
  if (!membership) {
    return { error: NextResponse.json({ error: "not a member" }, { status: 403 }) };
  }
  if (expense.settlementBatchId !== null) {
    // 已鎖入結算快照:改、刪一律拒絕
    return {
      error: NextResponse.json(
        { error: "expense locked in settlement snapshot" },
        { status: 409 },
      ),
    };
  }
  return { expense };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "sign in required" }, { status: 401 });
  }
  const { expenseId } = await params;
  const { expense, error } = await loadEditable(expenseId, session.userId);
  if (error) return error;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid input" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // 變更 payer / 分攤名單時,一樣必須全是本旅程成員
  const referenced = [
    ...new Set([
      ...(input.payerMemberId ? [input.payerMemberId] : []),
      ...(input.shareMemberIds ?? []),
    ]),
  ];
  if (referenced.length > 0) {
    const rows = await db
      .select({ id: tripMembers.id, tripId: tripMembers.tripId })
      .from(tripMembers)
      .where(inArray(tripMembers.id, referenced));
    const ok =
      rows.length === referenced.length &&
      rows.every((r) => r.tripId === expense.tripId);
    if (!ok) {
      return NextResponse.json(
        { error: "payer/share members must belong to this trip" },
        { status: 400 },
      );
    }
  }

  const updates = {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.amountUnits !== undefined && {
      amountUnits: BigInt(input.amountUnits),
    }),
    ...(input.payerMemberId !== undefined && {
      payerMemberId: input.payerMemberId,
    }),
    ...(input.occurredAt !== undefined && {
      occurredAt: new Date(input.occurredAt),
    }),
  };

  if (input.shareMemberIds) {
    const shareIds = [...new Set(input.shareMemberIds)];
    await db.batch([
      db.update(expenses).set(updates).where(eq(expenses.id, expenseId)),
      db.delete(expenseShares).where(eq(expenseShares.expenseId, expenseId)),
      db
        .insert(expenseShares)
        .values(shareIds.map((memberId) => ({ expenseId, memberId }))),
    ]);
  } else if (Object.keys(updates).length > 0) {
    await db.update(expenses).set(updates).where(eq(expenses.id, expenseId));
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "sign in required" }, { status: 401 });
  }
  const { expenseId } = await params;
  const { error } = await loadEditable(expenseId, session.userId);
  if (error) return error;

  // 軟刪除:保留紀錄可回溯
  await db
    .update(expenses)
    .set({ deletedAt: new Date() })
    .where(eq(expenses.id, expenseId));
  return NextResponse.json({ ok: true });
}
