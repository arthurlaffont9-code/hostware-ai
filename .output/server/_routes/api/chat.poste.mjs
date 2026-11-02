import { createError, defineEventHandler, getCookie, readBody } from "../../_libs/h3+rou3+srvx.mjs";
import { GoogleGenAI } from "../../_libs/@google/genai.mjs";
import { SESSION_COOKIE, getAdminFromSession } from "../../_chunks/auth.mjs";
// serveur/api/chat.poste.ts
var apiKey = process.env.GEMINI_API_KEY;
var ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
var chat_poste_default = defineEventHandler(async (event) => {
	const token = getCookie(event, SESSION_COOKIE);
	if (!token) throw createError({
		statusCode: 401,
		statusMessage: "Tu dois être connecté."
	});
	if (!await getAdminFromSession(token)) throw createError({
		statusCode: 401,
		statusMessage: "Session invalide ou expirée."
	});
	if (!ai) throw createError({
		statusCode: 500,
		statusMessage: "La clé API Gemini est manquante."
	});
	const body = await readBody(event);
	const message = typeof body?.message === "string" ? body.message.trim() : "";
	if (!message || message.length > 1e4) throw createError({
		statusCode: 400,
		statusMessage: "Le message est vide ou trop long (10 000 caractères maximum)."
	});
	try {
		return {
			success: true,
			reply: (await ai.models.generateContent({
				model: "gemini-2.5-flash",
				contents: ["Tu es Hostware AI, l'assistant interne de l'équipe Hostware, une entreprise d'hébergement informatique. Réponds en français, de manière claire et utile. N'invente jamais de tarifs, de caractéristiques techniques ou de procédures internes. Si tu ne connais pas une information, dis-le honnêtement.", `Question de l'équipe : ${message}`].join("\n\n")
			})).text || "Je n'ai pas pu générer de réponse."
		};
	} catch (error) {
		console.error("Erreur Gemini :", error);
		throw createError({
			statusCode: 502,
			statusMessage: "Gemini n'a pas pu répondre. Vérifie la clé API et réessaie."
		});
	}
});
export { chat_poste_default as default };
