import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon serverless driver 走 HTTP,適合 Vercel serverless functions
// (每次請求獨立連線,沒有連線池耗盡問題)
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
