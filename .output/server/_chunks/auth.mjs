import { db } from "./db.mjs";
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
// serveur/utils/auth.ts
var HOSTWARE_EMAIL_DOMAIN = (process.env.HOSTWARE_EMAIL_DOMAIN || "hostware.com").trim().toLowerCase().replace(/^@/, "");
var SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET.length < 32) throw new Error("SESSION_SECRET doit contenir au moins 32 caractères.");
var SESSION_COOKIE = "hostware_session";
var SESSION_DURATION_MS = 6048e5;
function isAllowedHostwareEmail(email) {
	const normalizedEmail = email.trim().toLowerCase();
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) && normalizedEmail.endsWith(`@${HOSTWARE_EMAIL_DOMAIN}`);
}
async function hashPassword(password) {
	if (password.length < 12) throw new Error("Le mot de passe doit contenir au moins 12 caractères.");
	return argon2.hash(password, { type: argon2.argon2id });
}
async function verifyPassword(hash, password) {
	try {
		return await argon2.verify(hash, password);
	} catch {
		return false;
	}
}
function hashToken(token) {
	return createHash("sha256").update(token).digest("hex");
}
async function createAdminSession(adminId) {
	const token = randomBytes(32).toString("hex");
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
	await db.query(`INSERT INTO admin_sessions (admin_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`, [
		adminId,
		hashToken(token),
		expiresAt
	]);
	return {
		token,
		expiresAt
	};
}
async function getAdminFromSession(token) {
	return (await db.query(`SELECT a.id, a.username, a.email
     FROM admin_sessions s
     JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = $1
       AND s.expires_at > NOW()
       AND a.is_active = TRUE
     LIMIT 1`, [hashToken(token)])).rows[0] ?? null;
}
async function deleteAdminSession(token) {
	await db.query("DELETE FROM admin_sessions WHERE token_hash = $1", [hashToken(token)]);
}
export { SESSION_COOKIE, createAdminSession, deleteAdminSession, getAdminFromSession, hashPassword, isAllowedHostwareEmail, verifyPassword };
