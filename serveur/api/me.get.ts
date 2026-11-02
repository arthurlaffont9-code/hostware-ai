
import {
  defineEventHandler,
  getCookie,
  createError,
} from "h3";
import {
  getAdminFromSession,
  SESSION_COOKIE,
} from "../utils/auth";


export default defineEventHandler(async (event) => {
  const token = getCookie(event, SESSION_COOKIE);

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Tu n'es pas connecté.",
    });
  }

  const admin = await getAdminFromSession(token);

  if (!admin) {
    throw createError({
      statusCode: 401,
      statusMessage: "Session invalide ou expirée.",
    });
  }

  return {
    success: true,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
    },
  };
});