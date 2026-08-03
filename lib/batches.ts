import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { settlementBatches, settlementItems } from "@/db/schema";

/**
 * 某筆剛結清後檢查:這一輪若再無 pending → batch 標記完成。
 * 線下結清與鏈上付款兩條路共用。
 */
export async function completeBatchIfSettled(
  batchId: string,
  justSettledItemId: string,
) {
  const remaining = await db.query.settlementItems.findFirst({
    where: and(
      eq(settlementItems.batchId, batchId),
      eq(settlementItems.status, "pending"),
      ne(settlementItems.id, justSettledItemId),
    ),
  });
  if (!remaining) {
    await db
      .update(settlementBatches)
      .set({ status: "completed" })
      .where(eq(settlementBatches.id, batchId));
  }
}
