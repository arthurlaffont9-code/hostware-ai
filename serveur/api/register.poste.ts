
import { defineEventHandler, readBody, createError } from "h3";
import { Resend } from "resend";
import { db } from "../utils/db";
import {
  hashPassword,
  isAllowedHostwareEmail,
  createVerificationToken,
  hashVerificationToken,
} from "../utils/auth";

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: unknown;
    username?: unknown;
    password?: unknown;
  }>(event);

  const email =
    typeof body?.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
  const username =
    typeof body?.username === "string" ? body.username.trim() : "";
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
      statusMessage: "Le nom doit contenir entre 3 et 50 caractères.",
    });
  }

  if (password.length < 12) {
    throw createError({
      statusCode: 400,
      statusMessage: "Le mot de passe doit contenir au moins 12 caractères.",
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;

  if (!apiKey || !emailFrom || !appUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "La configuration e-mail est incomplète.",
    });
  }

  const resend = new Resend(apiKey);
  const passwordHash = await hashPassword(password);
  const token = createVerificationToken();
  const tokenHash = hashVerificationToken(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const client = await db.connect();
  let adminId: string | null = null;

  try {
    await client.query("BEGIN");

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

    const result = await client.query(
      `INSERT INTO admins
       (username, email, password_hash, email_verified,
        verification_token_hash, verification_expires_at)
       VALUES ($1, $2, $3, FALSE, $4, $5)
       RETURNING id`,
      [username, email, passwordHash, tokenHash, expiresAt]
    );

    adminId = result.rows[0].id;
    await client.query("COMMIT");
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

    console.error("Erreur inscription :", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Impossible de créer le compte.",
    });
  } finally {
    client.release();
  }

  const verificationUrl =
    `${appUrl.replace(/\/$/, "")}/api/verify-email?token=${token}`;

  try {
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: "Confirme ton compte Hostware AI",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:30px;color:#172033">
          <h1>Bienvenue chez Hostware AI</h1>
          <p>Bonjour ${username},</p>
          <p>Pour confirmer ton adresse e-mail et activer ton compte, clique sur le bouton ci-dessous.</p>
          <p>
            <a href="${verificationUrl}"
              style="display:inline-block;padding:14px 22px;background:#4779ed;color:white;text-decoration:none;border-radius:8px">
              Confirmer mon adresse e-mail
            </a>
          </p>
          <p>Ce lien expire dans 30 minutes.</p>
          <p>Si tu n'as pas créé ce compte, ignore ce message.</p>
        </div>
      `,
    });

    if (error) throw error;
  } catch (error) {
    console.error("Erreur envoi e-mail :", error);

    if (adminId) {
      await db.query(
        `DELETE FROM admins
         WHERE id = $1 AND email_verified = FALSE`,
        [adminId]
      );
    }

    throw createError({
      statusCode: 502,
      statusMessage: "L'e-mail n'a pas pu être envoyé. Réessaie plus tard.",
    });
  }

  return {
    success: true,
    message: "Compte créé. Consulte ta boîte e-mail pour le confirmer.",
  };
});
