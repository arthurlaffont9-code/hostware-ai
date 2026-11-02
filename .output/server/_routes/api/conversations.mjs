import { createError, defineEventHandler, getCookie } from "../../_libs/h3+rou3+srvx.mjs";
import { db } from "../../_chunks/db.mjs";
import { SESSION_COOKIE, getAdminFromSession } from "../../_chunks/auth.mjs";
// serveur/api/conversations/index.get.ts
var index_get_default = defineEventHandler(async (event) => {
	const token = getCookie(event, SESSION_COOKIE);
	if (!token) throw createError({
		statusCode: 401,
		statusMessage: "Tu dois être connecté."
	});
	const admin = await getAdminFromSession(token);
	if (!admin) throw createError({
		statusCode: 401,
		statusMessage: "Session invalide ou expirée."
	});
	return {
		success: true,
		conversations: (await db.query(`SELECT id, title, created_at
     FROM conversations
     WHERE admin_id = $1
     ORDER BY created_at DESC`, [admin.id])).rows
	};
});
export { index_get_default as default };
