
import {
  defineEventHandler,
  getCookie,
  readBody,
  createError,
} from "h3";
import { db } from "../../utils/db";
import {
  getAdminFromSession,
  SESSION_COOKIE,
} from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, SESSION_COOKIE);

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Tu dois être connecté.",
    });
  }

  const admin = await getAdminFromSession(token);

  if (!admin) {
    throw createError({
      statusCode: 401,
      statusMessage: "Session invalide ou expirée.",
    });
  }

  const body = await readBody<{ title?: unknown }>(event);

  const title =
    typeof body?.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 200)
      : "Nouvelle conversation";

  const result = await db.query(
    `INSERT INTO conversations (admin_id, title)
     VALUES ($1, $2)
     RETURNING id, title, created_at`,
    [admin.id, title]
  );

  return {
    success: true,
    conversation: result.rows[0],
  };
});
