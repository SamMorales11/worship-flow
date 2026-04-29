import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import path from 'path';

// Note: In production, you would probably want to rely on environment variables
// being injected by the platform, but for local dev, we load from the root .env
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

let pool: Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

export const getDb = (connectionString?: string) => {
  if (!db) {
    pool = new Pool({
      connectionString: connectionString || process.env.DATABASE_URL,
    });
    db = drizzle(pool, { schema });
  }
  return db;
};

export { schema };
