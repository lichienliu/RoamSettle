import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * RoamSettle 資料模型(規格 §6)。
 *
 * 金額規則(規格 §5-2):一律以「最小單位整數」儲存 —
 * - expenses.amount_units:記帳幣別的最小單位(JPY=1、TWD=0.01 元⋯)
 * - *_usdc_units:USDC 6 位小數(1 USDC = 1_000_000)
 * 全部用 bigint(mode: "bigint"),應用層只准 BigInt 運算。
 *
 * 快照規則(規格 §5-3):結算鎖定採「版本標記」—
 * expenses.settlement_batch_id 一旦寫入即視為凍結,應用層拒絕改刪。
 */

export const tripStatus = pgEnum("trip_status", ["active", "completed"]);
export const memberRole = pgEnum("member_role", ["organizer", "member"]);
export const batchStatus = pgEnum("batch_status", ["open", "completed"]);
export const itemStatus = pgEnum("item_status", [
  "pending",
  "paid",
  "settled_offline",
]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "confirmed",
  "failed",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // 一般旅伴免錢包即可記帳,連錢包後才回填(規格 §3)
  walletAddress: text("wallet_address").unique(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  // 單一記帳幣別(ISO 4217,如 "JPY");v0.5 不支援混合幣別
  baseCurrency: text("base_currency").notNull(),
  creatorUserId: uuid("creator_user_id")
    .notNull()
    .references(() => users.id),
  inviteToken: text("invite_token").notNull().unique(),
  status: tripStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tripMembers = pgTable(
  "trip_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id),
    // 免錢包成員沒有 users 紀錄,只有暱稱
    userId: uuid("user_id").references(() => users.id),
    nickname: text("nickname").notNull(),
    // 收款需要地址;可與 users.wallet_address 不同步存在(先填地址後綁帳號)
    walletAddress: text("wallet_address"),
    role: memberRole("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("trip_members_trip_idx").on(t.tripId),
    // 同一 user 在同一旅程只能是一個成員(免錢包成員 user_id 為 null 不受限)
    uniqueIndex("trip_members_trip_user_uq")
      .on(t.tripId, t.userId)
      .where(sql`${t.userId} is not null`),
  ],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id),
    payerMemberId: uuid("payer_member_id")
      .notNull()
      .references(() => tripMembers.id),
    title: text("title").notNull(),
    // 記帳幣別最小單位;幣別取自所屬 trip.base_currency
    amountUnits: bigint("amount_units", { mode: "bigint" }).notNull(),
    createdByMemberId: uuid("created_by_member_id")
      .notNull()
      .references(() => tripMembers.id),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    // 軟刪除;已鎖入快照的帳目連軟刪除都不允許(應用層擋)
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    // 版本標記凍結:寫入即代表已鎖入該結算快照,不可再改刪
    settlementBatchId: uuid("settlement_batch_id").references(
      () => settlementBatches.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("expenses_trip_idx").on(t.tripId),
    index("expenses_batch_idx").on(t.settlementBatchId),
    check("expenses_amount_positive", sql`${t.amountUnits} > 0`),
  ],
);

export const expenseShares = pgTable(
  "expense_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expenseId: uuid("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => tripMembers.id),
  },
  (t) => [
    // 勾選誰分攤;平均分攤的每人金額由後端以 BigInt 計算,不落地存
    uniqueIndex("expense_shares_expense_member_uq").on(t.expenseId, t.memberId),
  ],
);

export const settlementBatches = pgTable(
  "settlement_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id),
    lockedAt: timestamp("locked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // 匯率以分子/分母整數存(規格 §6 備註),絕不用浮點:
    // 記帳幣別金額 × numerator / denominator = USDC units
    fxRateNumerator: bigint("fx_rate_numerator", { mode: "bigint" }).notNull(),
    fxRateDenominator: bigint("fx_rate_denominator", {
      mode: "bigint",
    }).notNull(),
    status: batchStatus("status").notNull().default("open"),
  },
  (t) => [
    index("settlement_batches_trip_idx").on(t.tripId),
    check("fx_numerator_positive", sql`${t.fxRateNumerator} > 0`),
    check("fx_denominator_positive", sql`${t.fxRateDenominator} > 0`),
  ],
);

export const settlementItems = pgTable(
  "settlement_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => settlementBatches.id),
    debtorMemberId: uuid("debtor_member_id")
      .notNull()
      .references(() => tripMembers.id),
    creditorMemberId: uuid("creditor_member_id")
      .notNull()
      .references(() => tripMembers.id),
    amountUsdcUnits: bigint("amount_usdc_units", { mode: "bigint" }).notNull(),
    status: itemStatus("status").notNull().default("pending"),
  },
  (t) => [
    index("settlement_items_batch_idx").on(t.batchId),
    check("settlement_amount_positive", sql`${t.amountUsdcUnits} > 0`),
    check(
      "debtor_not_creditor",
      sql`${t.debtorMemberId} <> ${t.creditorMemberId}`,
    ),
  ],
);

export const settlementPayments = pgTable(
  "settlement_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    settlementItemId: uuid("settlement_item_id")
      .notNull()
      .references(() => settlementItems.id),
    payerAddress: text("payer_address").notNull(),
    recipientAddress: text("recipient_address").notNull(),
    expectedAmountUnits: bigint("expected_amount_units", {
      mode: "bigint",
    }).notNull(),
    // 後端驗證交易後回填鏈上實際金額(規格 §5-4)
    actualAmountUnits: bigint("actual_amount_units", { mode: "bigint" }),
    // UNIQUE 防同一筆鏈上交易重複核銷(規格 §5-4);線下結清為 null
    transactionId: text("transaction_id").unique(),
    status: paymentStatus("status").notNull().default("pending"),
    settledOffline: boolean("settled_offline").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  },
  (t) => [
    index("settlement_payments_item_idx").on(t.settlementItemId),
    // 鏈上付款必有 transaction_id;沒有 tx 的只能是線下結清
    check(
      "onchain_or_offline",
      sql`${t.transactionId} is not null or ${t.settledOffline} = true`,
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(tripMembers),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  creator: one(users, { fields: [trips.creatorUserId], references: [users.id] }),
  members: many(tripMembers),
  expenses: many(expenses),
  settlementBatches: many(settlementBatches),
}));

export const tripMembersRelations = relations(tripMembers, ({ one, many }) => ({
  trip: one(trips, { fields: [tripMembers.tripId], references: [trips.id] }),
  user: one(users, { fields: [tripMembers.userId], references: [users.id] }),
  shares: many(expenseShares),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  trip: one(trips, { fields: [expenses.tripId], references: [trips.id] }),
  payer: one(tripMembers, {
    fields: [expenses.payerMemberId],
    references: [tripMembers.id],
  }),
  shares: many(expenseShares),
  settlementBatch: one(settlementBatches, {
    fields: [expenses.settlementBatchId],
    references: [settlementBatches.id],
  }),
}));

export const expenseSharesRelations = relations(expenseShares, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseShares.expenseId],
    references: [expenses.id],
  }),
  member: one(tripMembers, {
    fields: [expenseShares.memberId],
    references: [tripMembers.id],
  }),
}));

export const settlementBatchesRelations = relations(
  settlementBatches,
  ({ one, many }) => ({
    trip: one(trips, {
      fields: [settlementBatches.tripId],
      references: [trips.id],
    }),
    items: many(settlementItems),
    expenses: many(expenses),
  }),
);

export const settlementItemsRelations = relations(
  settlementItems,
  ({ one, many }) => ({
    batch: one(settlementBatches, {
      fields: [settlementItems.batchId],
      references: [settlementBatches.id],
    }),
    debtor: one(tripMembers, {
      fields: [settlementItems.debtorMemberId],
      references: [tripMembers.id],
    }),
    creditor: one(tripMembers, {
      fields: [settlementItems.creditorMemberId],
      references: [tripMembers.id],
    }),
    payments: many(settlementPayments),
  }),
);

export const settlementPaymentsRelations = relations(
  settlementPayments,
  ({ one }) => ({
    item: one(settlementItems, {
      fields: [settlementPayments.settlementItemId],
      references: [settlementItems.id],
    }),
  }),
);
