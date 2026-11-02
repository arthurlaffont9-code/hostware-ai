import { createError, defineEventHandler, getCookie, readBody } from "../../_libs/h3+rou3+srvx.mjs";
import { db } from "../../_chunks/db.mjs";
import { SESSION_COOKIE, getAdminFromSession } from "../../_chunks/auth.mjs";
// serveur/api/conversations/index.post.ts
var index_post_default = defineEventHandler(async (event) => {
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
	const body = await readBody(event);
	const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim().slice(0, 200) : "Nouvelle conversation";
	return {
		success: true,
		conversation: (await db.query(`INSERT INTO conversations (admin_id, title)
     VALUES ($1, $2)
     RETURNING id, title, created_at`, [admin.id, title])).rows[0]
	};
});
export { index_post_default as default };
