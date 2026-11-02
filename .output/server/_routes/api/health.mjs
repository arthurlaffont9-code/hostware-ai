import { createError, defineEventHandler } from "../../_libs/h3+rou3+srvx.mjs";
import { db } from "../../_chunks/db.mjs";
// serveur/api/health.get.ts
var health_get_default = defineEventHandler(async () => {
	try {
		const result = await db.query("SELECT current_database() AS database, NOW() AS time");
		return {
			status: "ok",
			message: "Hostware AI est connecté à PostgreSQL !",
			database: result.rows[0].database,
			time: result.rows[0].time
		};
	} catch (error) {
		console.error("Erreur PostgreSQL :", error);
		throw createError({
			statusCode: 500,
			statusMessage: "Impossible de se connecter à la base de données"
		});
	}
});
export { health_get_default as default };
