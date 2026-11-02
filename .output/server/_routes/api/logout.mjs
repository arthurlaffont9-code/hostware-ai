import { defineEventHandler, getCookie, setCookie } from "../../_libs/h3+rou3+srvx.mjs";
import { SESSION_COOKIE, deleteAdminSession } from "../../_chunks/auth.mjs";
// serveur/api/logout.post.ts
var logout_post_default = defineEventHandler(async (event) => {
	const token = getCookie(event, SESSION_COOKIE);
	if (token) await deleteAdminSession(token);
	setCookie(event, SESSION_COOKIE, "", {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 0
	});
	return {
		success: true,
		message: "Déconnexion réussie."
	};
});
export { logout_post_default as default };
