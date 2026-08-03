/** 前端 API 層:薄 fetch 包裝,錯誤統一丟 Error(message)。 */

export type Me = {
  id: string;
  walletAddress: string | null;
  displayName: string;
} | null;

export type TripSummary = {
  id: string;
  name: string;
  baseCurrency: string;
  startDate: string | null;
  endDate: string | null;
  status: "active" | "completed";
  role: "organizer" | "member";
  memberCount: number;
};

export type Member = {
  id: string;
  nickname: string;
  role: "organizer" | "member";
  hasWallet: boolean;
};

export type Expense = {
  id: string;
  title: string;
  amountUnits: string;
  payerMemberId: string;
  occurredAt: string;
  locked: boolean;
  shareMemberIds: string[];
};

export type TripDetail = {
  trip: {
    id: string;
    name: string;
    baseCurrency: string;
    startDate: string | null;
    endDate: string | null;
    status: "active" | "completed";
    inviteToken: string | null;
  };
  myMemberId: string;
  members: Member[];
  expenses: Expense[];
  balances: { memberId: string; netUnits: string }[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `request failed (${res.status})`);
  return data as T;
}

export const api = {
  me: () => request<{ user: Me }>("/api/me"),
  listTrips: () => request<{ trips: TripSummary[] }>("/api/trips"),
  createTrip: (body: {
    name: string;
    baseCurrency: string;
    startDate?: string;
    endDate?: string;
  }) =>
    request<{ id: string; inviteToken: string }>("/api/trips", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  tripDetail: (tripId: string) => request<TripDetail>(`/api/trips/${tripId}`),
  invitePreview: (token: string) =>
    request<{ tripName: string; baseCurrency: string; memberCount: number }>(
      `/api/join/${token}`,
    ),
  join: (token: string, nickname: string) =>
    request<{ tripId: string; memberId: string }>(`/api/join/${token}`, {
      method: "POST",
      body: JSON.stringify({ nickname }),
    }),
  addExpense: (
    tripId: string,
    body: {
      title: string;
      amountUnits: string;
      payerMemberId: string;
      shareMemberIds: string[];
    },
  ) =>
    request<{ id: string }>(`/api/trips/${tripId}/expenses`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteExpense: (expenseId: string) =>
    request<{ ok: true }>(`/api/expenses/${expenseId}`, { method: "DELETE" }),
};
