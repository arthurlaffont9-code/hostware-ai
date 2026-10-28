
import { defineEventHandler, readBody, createError } from "h3";
import { db } from "../utils/db";
import {
  hashPassword,
  isAllowedHostwareEmail,
} from "../utils/auth";

export default defineEventHandler(async (event) => {
  const body = await readBody<{
  email?: unknown;
  username?: unknown;
  password?: unknown;
}>(event);

  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const username =
    typeof body?.username === "string"
      ? body.username.trim()
      : "";
  const password =
    typeof body?.password === "string" ? body.password : "";

  if (!isAllowedHostwareEmail(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Une adresse e-mail @hostware.com est nécessaire.",
    });
  }

  if (!/^[a-zA-Z0-9_-]{3,50}$/.test(username)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Le nom doit contenir 3 à 50 caractères (lettres, chiffres, _ ou -).",
    });
  }

  if (password.length < 12) {
    throw createError({
      statusCode: 400,
      statusMessage: "Le mot de passe doit contenir au moins 12 caractères.",
    });
  }

  const passwordHash = await hashPassword(password);
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Sérialise les inscriptions pour empêcher de dépasser 5 comptes.
    await client.query(
      "SELECT pg_advisory_xact_lock($1, $2)",
      [741852, 963]
    );

    const countResult = await client.query(
      "SELECT COUNT(*)::int AS total FROM admins"
    );

    if (countResult.rows[0].total >= 5) {
      throw createError({
        statusCode: 403,
        statusMessage: "Les 5 comptes Hostware sont déjà utilisés.",
      });
    }

    await client.query(
      `INSERT INTO admins (username, email, password_hash)
       VALUES ($1, $2, $3)`,
      [username, email, passwordHash]
    );

    await client.query("COMMIT");

    return {
      success: true,
      message: "Compte créé. La vérification de l'adresse e-mail doit encore être configurée.",
    };
  } catch (error: unknown) {
    await client.query("ROLLBACK");

    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error
    ) {
      throw error;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: "Cette adresse e-mail ou ce nom est déjà utilisé.",
      });
    }

    console.error("Erreur lors de l'inscription :", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Impossible de créer le compte.",
    });
  } finally {
    client.release();
  }
});
