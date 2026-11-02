
import {
  defineEventHandler,
  readBody,
  createError,
  getCookie,
} from "h3";
import { GoogleGenAI } from "@google/genai";
import {
  getAdminFromSession,
  SESSION_COOKIE,
} from "../utils/auth";

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

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

  if (!ai) {
    throw createError({
      statusCode: 500,
      statusMessage: "La clé API Gemini est manquante.",
    });
  }

  const body = await readBody<{ message?: unknown }>(event);
  const message =
    typeof body?.message === "string" ? body.message.trim() : "";

  if (!message || message.length > 10000) {
    throw createError({
      statusCode: 400,
      statusMessage: "Le message est vide ou trop long (10 000 caractères maximum).",
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        "Tu es Hostware AI, l'assistant interne de l'équipe Hostware, une entreprise d'hébergement informatique. Réponds en français, de manière claire et utile. N'invente jamais de tarifs, de caractéristiques techniques ou de procédures internes. Si tu ne connais pas une information, dis-le honnêtement.",
        `Question de l'équipe : ${message}`,
      ].join("\n\n"),
    });

    return {
      success: true,
      reply: response.text || "Je n'ai pas pu générer de réponse.",
    };
  } catch (error) {
    console.error("Erreur Gemini :", error);

    throw createError({
      statusCode: 502,
      statusMessage: "Gemini n'a pas pu répondre. Vérifie la clé API et réessaie.",
    });
  }
});
