import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL est manquant dans le fichier .env");
}

export const db = new Pool({
  connectionString,
});