import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tripMembers } from "@/db/schema";

/** URL-safe 邀請 token(16 bytes 熵)。 */
export function generateInviteToken() {
  return randomBytes(16).toString("base64url");
}

/** 查 session user 在該旅程的成員身分;非成員回 undefined。 */
export function findMembership(tripId: string, userId: string) {
  return db.query.tripMembers.findFirst({
    where: and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)),
  });
}
