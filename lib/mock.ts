/**
 * Mock data for the UI prototype, lifted from the design doc (direction 2a).
 * Numbers are internally consistent: balances sum to zero and the four
 * simplified transfers reproduce every net position.
 */

export type PersonId = "me" | "wei" | "yuki" | "amber" | "diego";

export interface Person {
  id: PersonId;
  name: string;
  initial: string;
  /** Tailwind background class for the avatar block */
  color: string;
}

export const PEOPLE: Record<PersonId, Person> = {
  me: { id: "me", name: "You", initial: "ME", color: "bg-ink" },
  wei: { id: "wei", name: "Wei", initial: "W", color: "bg-cobalt" },
  yuki: { id: "yuki", name: "Yuki", initial: "Y", color: "bg-gain" },
  amber: { id: "amber", name: "Amber", initial: "A", color: "bg-tangerine" },
  diego: { id: "diego", name: "Diego", initial: "D", color: "bg-violet" },
};

export const TRIP = {
  name: "Tokyo, 5 days",
  dates: "APR 10 — APR 15",
  baseCurrency: "TWD",
  inviteUrl: "roamsettle.app/j/tokyo-5d",
  totalSpendTwd: "53,922",
  totalSpendJpy: "¥254,350",
  expenseCount: 7,
  youOweTwd: "7,328",
  youOweUsdc: "226.17",
};

/** Home — what stands between you and each person */
export const PAIRWISE = [
  { person: PEOPLE.wei, context: "Fronted the apartment", amount: "3,335" },
  { person: PEOPLE.yuki, context: "Car rental and tolls", amount: "2,120" },
  { person: PEOPLE.amber, context: "Transfers, kimono, pharmacy", amount: "1,781" },
  { person: PEOPLE.diego, context: "Almost even", amount: "92" },
];

/** Overview — net position per person (TWD, positive = is owed) */
export const BALANCES = [
  { label: "WEI", amount: "+9,801", pct: 88, positive: true },
  { label: "YUKI", amount: "+2,009", pct: 20, positive: true },
  { label: "AMBR", amount: "+1,935", pct: 18, positive: true },
  { label: "YOU", amount: "-7,328", pct: 66, positive: false },
  { label: "DIEG", amount: "-6,417", pct: 58, positive: false },
];

export const EXPENSES = [
  {
    tag: "STY",
    title: "Asakusa apartment, 2 nights",
    byline: "Wei paid · split 5 ways",
    twd: "20,352",
    original: "¥96,000",
    highlight: false,
  },
  {
    tag: "TRN",
    title: "Fuji car rental + tolls",
    byline: "Yuki paid · split 5 ways",
    twd: "13,144",
    original: "¥62,000",
    highlight: false,
  },
  {
    tag: "FUN",
    title: "Airport transfer + kimono",
    byline: "Amber paid · split 5 ways",
    twd: "11,448",
    original: "¥54,000",
    highlight: false,
  },
  {
    tag: "TRN",
    title: "JR travel card top-up",
    byline: "You paid · split 4 ways · just now",
    twd: "2,544",
    original: "¥12,000",
    highlight: true,
  },
];

/** Settle — transfers between the others (yours is the hero card) */
export const OTHER_TRANSFERS = [
  { from: PEOPLE.diego, to: PEOPLE.wei, label: "Diego pays Wei", amount: "2,473" },
  { from: PEOPLE.diego, to: PEOPLE.yuki, label: "Diego pays Yuki", amount: "2,009" },
  { from: PEOPLE.diego, to: PEOPLE.amber, label: "Diego pays Amber", amount: "1,935" },
];

export const PAYMENT = {
  to: PEOPLE.wei,
  usdc: "226.17",
  twd: "7,328",
  toAddress: "0x8f2c…41ab",
  walletBalance: "312.40 USDC",
  txHash: "0x7f3a…b21c",
  completedAt: "APR 15, 21:04",
};

/** JPY → TWD rate used on the log-expense screen */
export const JPY_TO_TWD = 0.212;
