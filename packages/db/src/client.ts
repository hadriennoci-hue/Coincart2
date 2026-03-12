import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import pg from "pg";

const { Pool } = pg;

export const createDb = (connectionString: string) => {
  // Cloudflare Workers + Neon: force fetch transport to avoid socket hangs in Worker isolates.
  if (connectionString.includes(".neon.tech")) {
    neonConfig.poolQueryViaFetch = true;
    const pool = new NeonPool({ connectionString });
    return drizzleNeon(pool);
  }

  const pool = new Pool({ connectionString });
  return drizzlePg(pool);
};
