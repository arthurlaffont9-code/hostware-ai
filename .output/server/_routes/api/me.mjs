import { createError, defineEventHandler, getCookie } from "../../_libs/h3+rou3+srvx.mjs";
import { SESSION_COOKIE, getAdminFromSession } from "../../_chunks/auth.mjs";
// serveur/api/me.get.ts
var me_get_default = defineEventHandler(async (event) => {
	const token = getCookie(event, SESSION_COOKIE);
	if (!token) throw createError({
		statusCode: 401,
		statusMessage: "Tu n'es pas connecté."
	});
	const admin = await getAdminFromSession(token);
	if (!admin) throw createError({
		statusCode: 401,
		statusMessage: "Session invalide ou expirée."
	});
	return {
		success: true,
		admin: {
			id: admin.id,
			username: admin.username,
			email: admin.email
		}
	};
});
export { me_get_default as default };
