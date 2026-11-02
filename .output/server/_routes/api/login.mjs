import { createError, defineEventHandler, readBody, setCookie } from "../../_libs/h3+rou3+srvx.mjs";
import { db } from "../../_chunks/db.mjs";
import { SESSION_COOKIE, createAdminSession, isAllowedHostwareEmail, verifyPassword } from "../../_chunks/auth.mjs";
// serveur/api/login.post.ts
var login_post_default = defineEventHandler(async (event) => {
	const body = await readBody(event);
	const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
	const password = typeof body?.password === "string" ? body.password : "";
	if (!isAllowedHostwareEmail(email) || password.length === 0) throw createError({
		statusCode: 401,
		statusMessage: "Adresse e-mail ou mot de passe incorrect."
	});
	const admin = (await db.query(`SELECT id, username, email, password_hash
     FROM admins
     WHERE email = $1
       AND is_active = TRUE
     LIMIT 1`, [email])).rows[0];
	if (!admin || !await verifyPassword(admin.password_hash, password)) throw createError({
		statusCode: 401,
		statusMessage: "Adresse e-mail ou mot de passe incorrect."
	});
	const session = await createAdminSession(admin.id);
	setCookie(event, SESSION_COOKIE, session.token, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		expires: session.expiresAt
	});
	return {
		success: true,
		message: "Connexion réussie.",
		admin: {
			id: admin.id,
			username: admin.username,
			email: admin.email
		}
	};
});
export { login_post_default as default };
