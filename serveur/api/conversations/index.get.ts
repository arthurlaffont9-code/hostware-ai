
import {
  defineEventHandler,
  getCookie,
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

  const result = await db.query(
    `SELECT id, title, created_at
     FROM conversations
     WHERE admin_id = $1
     ORDER BY created_at DESC`,
    [admin.id]
  );

  return {
    success: true,
    conversations: result.rows,
  };
});
