
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

const HOSTWARE_EMAIL_DOMAIN = (
  process.env.HOSTWARE_EMAIL_DOMAIN || "hostware.com"
)
  .trim()
  .toLowerCase()
  .replace(/^@/, "");

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET doit contenir au moins 32 caractères.");
}

export const SESSION_COOKIE = "hostware_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function isAllowedHostwareEmail(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (
    emailPattern.test(normalizedEmail) &&
    normalizedEmail.endsWith(`@${HOSTWARE_EMAIL_DOMAIN}`)
  );
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12) {
    throw new Error("Le mot de passe doit contenir au moins 12 caractères.");
  }

  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.query(
    `INSERT INTO admin_sessions (admin_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [adminId, hashToken(token), expiresAt]
  );

  return { token, expiresAt };
}

export async function getAdminFromSession(token: string) {
  const result = await db.query(
    `SELECT a.id, a.username, a.email
     FROM admin_sessions s
     JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = $1
       AND s.expires_at > NOW()
       AND a.is_active = TRUE
     LIMIT 1`,
    [hashToken(token)]
  );

  return result.rows[0] ?? null;
}

export async function deleteAdminSession(token: string): Promise<void> {
  await db.query(
    "DELETE FROM admin_sessions WHERE token_hash = $1",
    [hashToken(token)]
  );
}
