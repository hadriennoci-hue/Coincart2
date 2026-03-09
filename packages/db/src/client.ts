import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

export const createDb = (connectionString: string) => {
  const pool = new Pool({ connectionString });
  return drizzle(pool);
};