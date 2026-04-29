import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Ini bagian pentingnya: arahkan ke file .env di root
dotenv.config({ path: "../../.env" }); 

export default defineConfig({
  schema: "./schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
});