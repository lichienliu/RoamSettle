import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { erc20Abi, parseEventLogs, TransactionReceiptNotFoundError } from "viem";
import { db } from "@/db";
import {
  settlementBatches,
  settlementItems,
  settlementPayments,
  tripMembers,
  users,
} from "@/db/schema";
import { completeBatchIfSettled } from "@/lib/batches";
import { chain, publicClient, USDC_ADDRESS } from "@/lib/chain";
import { getSession } from "@/lib/session";
import { findMembership } from "@/lib/trips";

const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

/** 剛送出的交易要等下一個 block 才查得到;Base 出塊 ~2s,最多等 ~20s。 */
async function fetchReceiptWithRetry(hash: `0x${string}`) {
  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2500));
    try {
      return await publicClient.getTransactionReceipt({ hash });
    } catch (e) {
      if (!(e instanceof TransactionReceiptNotFoundError)) throw e;
    }
  }
  return null;
}

/** neon 驅動的錯誤可能被 drizzle 包一層,沿 cause 鏈找 23505。 */
function isUniqueViolation(e: unknown): boolean {
  let cur = e as { code?: string; message?: string; cause?: unknown } | null;
  for (let depth = 0; cur && depth < 5; depth++) {
    if (cur.code === "23505" || /duplicate key/i.test(cur.message ?? "")) {
      return true;
    }
    cur = cur.cause as typeof cur;
  }
  return false;
}

/**
 * 核銷鏈上付款(規則 #4):不信任前端回報,後端親自查鏈 —
 * tx 必須成功、且含一筆「debtor 綁定錢包 → creditor 收款地址、
 * 金額分毫不差」的 USDC Transfer;transaction_id UNIQUE 防重複核銷。
 * 鏈別不用另驗:publicClient 只連本 app 的鏈,別鏈的 hash 查不到收據。
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "sign in required" }, { status: 401 });
  }
  const { itemId } = await params;

  const body = await req.json().catch(() => null);
  const txHash = body?.txHash;
  if (typeof txHash !== "string" || !TX_HASH_RE.test(txHash)) {
    return NextResponse.json({ error: "invalid txHash" }, { status: 400 });
  }

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
  if (!membership || membership.id !== item.debtorMemberId) {
    return NextResponse.json(
      { error: "only the debtor can submit this payment" },
      { status: 403 },
    );
  }

  // sender 比對基準 = 付款人「經 SIWE 簽名證明」綁定的錢包(/api/auth/link),
  // 否則任何人都能拿別人恰好同額的轉帳來冒充自己已付款
  const payer = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  const payerWallet = payer?.walletAddress;
  if (!payerWallet) {
    return NextResponse.json(
      { error: "link your wallet before paying" },
      { status: 409 },
    );
  }

  const creditor = await db.query.tripMembers.findFirst({
    where: eq(tripMembers.id, item.creditorMemberId),
    with: { user: { columns: { walletAddress: true } } },
  });
  const recipient = creditor?.walletAddress ?? creditor?.user?.walletAddress;
  if (!recipient) {
    return NextResponse.json(
      { error: "recipient has not linked a wallet" },
      { status: 409 },
    );
  }

  const receipt = await fetchReceiptWithRetry(txHash as `0x${string}`);
  if (!receipt) {
    return NextResponse.json(
      { error: `transaction not found on ${chain.name} — try again shortly` },
      { status: 404 },
    );
  }
  if (receipt.status !== "success") {
    return NextResponse.json({ error: "transaction reverted" }, { status: 400 });
  }

  // 從 receipt 的 event log 找轉帳(智慧錢包的 tx.to 是帳戶合約不是 USDC,
  // 不能看 tx 本體;Transfer log 才是資金真正移動的紀錄)
  const transfers = parseEventLogs({
    abi: erc20Abi,
    logs: receipt.logs,
    eventName: "Transfer",
  });
  const match = transfers.find(
    (log) =>
      log.address.toLowerCase() === USDC_ADDRESS.toLowerCase() &&
      log.args.from.toLowerCase() === payerWallet &&
      log.args.to.toLowerCase() === recipient.toLowerCase() &&
      log.args.value === item.amountUsdcUnits,
  );
  if (!match) {
    return NextResponse.json(
      { error: "no matching USDC transfer (sender / recipient / amount)" },
      { status: 400 },
    );
  }

  try {
    await db.batch([
      db.insert(settlementPayments).values({
        settlementItemId: item.id,
        payerAddress: payerWallet,
        recipientAddress: recipient.toLowerCase(),
        expectedAmountUnits: item.amountUsdcUnits,
        actualAmountUnits: match.args.value,
        transactionId: txHash.toLowerCase(),
        status: "confirmed",
        confirmedAt: new Date(),
      }),
      // status 條件擋並發重複核銷;極端競態下多出的 payment row
      // 對應的都是真實上鏈交易,留著反而是誠實的稽核紀錄
      db
        .update(settlementItems)
        .set({ status: "paid" })
        .where(
          and(
            eq(settlementItems.id, item.id),
            eq(settlementItems.status, "pending"),
          ),
        ),
    ]);
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json(
        { error: "this transaction was already used to settle a payment" },
        { status: 409 },
      );
    }
    throw e;
  }

  await completeBatchIfSettled(item.batchId, item.id);

  return NextResponse.json({ ok: true, txHash: txHash.toLowerCase() });
}
