
import { defineEventHandler, getQuery, createError } from "h3";
import { db } from "../utils/db";
import { hashVerificationToken } from "../utils/auth";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = typeof query.token === "string" ? query.token : "";

  if (!/^[a-f0-9]{64}$/.test(token)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Lien de confirmation invalide.",
    });
  }

  const result = await db.query(
    `UPDATE admins
     SET email_verified = TRUE,
         is_active = TRUE,
         verification_token_hash = NULL,
         verification_expires_at = NULL
     WHERE verification_token_hash = $1
       AND verification_expires_at > NOW()
       AND email_verified = FALSE
     RETURNING id, username, email`,
    [hashVerificationToken(token)]
  );

  if (result.rowCount === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ce lien est invalide, expiré ou déjà utilisé.",
    });
  }

  return {
    success: true,
    message: "Adresse e-mail confirmée ! Ton compte Hostware est activé.",
  };
});
