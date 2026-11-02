
import {
  defineEventHandler,
  getCookie,
  setCookie,
} from "h3";
import {
  deleteAdminSession,
  SESSION_COOKIE,
} from "../utils/auth";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, SESSION_COOKIE);

  if (token) {
    await deleteAdminSession(token);
  }

  setCookie(event, SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return {
    success: true,
    message: "Déconnexion réussie.",
  };
});
