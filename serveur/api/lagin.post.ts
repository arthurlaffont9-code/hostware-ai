
import { defineEventHandler, readBody, createError } from "h3";
import { db } from "../utils/db";
import { verifyPassword, isAllowedHostwareEmail } from "../utils/auth";

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: unknown;
    password?: unknown;
  }>(event);

  const email =
    typeof body?.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
      const password =
    typeof body?.password === "string" ? body.password : "";

  if (
    !isAllowedHostwareEmail(email) ||
    password.length === 0
  ) {
    throw createError({
      statusCode: 401,
      statusMessage: "Adresse e-mail ou mot de passe incorrect.",
    });
  }

  const result = await db.query(
    `SELECT id, username, email, password_hash
     FROM admins
     WHERE email = $1
       AND is_active = TRUE
     LIMIT 1`,
    [email]
  );

  const admin = result.rows[0];

  if (
    !admin ||
    !(await verifyPassword(admin.password_hash, password))
  ) {
    throw createError({
      statusCode: 401,
      statusMessage: "Adresse e-mail ou mot de passe incorrect.",
    });
  }

  // La session sécurisée sera ajoutée à l'étape suivante.
  return {
    success: true,
    message: "Identifiants valides. La session n'est pas encore configurée.",
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
    },
  };
});