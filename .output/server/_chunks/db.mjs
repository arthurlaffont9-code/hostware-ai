import { Pool } from "../_libs/pg.mjs";
// serveur/utils/db.ts
var connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL est manquant dans le fichier .env");
var db = new Pool({ connectionString });
export { db };
