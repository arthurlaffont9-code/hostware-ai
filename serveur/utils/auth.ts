
import argon2 from "argon2";

const HOSTWARE_EMAIL_DOMAIN = (
  process.env.HOSTWARE_EMAIL_DOMAIN || "hostware.com"
)
  .trim()
  .toLowerCase()
  .replace(/^@/, "");

export function isAllowedHostwareEmail(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    return false;
  }

  return normalizedEmail.endsWith(`@${HOSTWARE_EMAIL_DOMAIN}`);
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12) {
    throw new Error("Le mot de passe doit contenir au moins 12 caractères.");
  }

  return argon2.hash(password, {
    type: argon2.argon2id,
  });
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
