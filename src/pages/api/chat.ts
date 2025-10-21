import type { APIRoute } from "astro";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Obtener la API Key de las variables de entorno
const apiKey = import.meta.env.GOOGLE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Configuración del modelo
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", //version de GEMINI
});

const generationConfig = {
  temperature: 0.9,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
};

// Configuración de seguridad (ajusta según tus necesidades)
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export const POST: APIRoute = async ({ request }) => {
  try {
    const { history, message } = await request.json();

    // ¡Aquí está la clave! Dale contexto al chatbot sobre ti.
    const systemPrompt = `
      Eres un asistente virtual amigable y profesional en el portafolio de Alan Ricardo Matos Pérez.
      Tu nombre es "AlanBot".
      Alan es un Ingeniero en Desarrollo y Gestión de Software.
      Su portafolio incluye proyectos como:
      1. Sistema de Control Escolar para la UPN 231 (Laravel, Blade, Tailwind).
      2. Taxi Seguro para el IMOVEQROO (Geolocalización, autenticación).
      
      Tu objetivo es responder preguntas sobre Alan, sus proyectos, o temas de tecnología relacionados.
      Sé conciso y amigable. Si no sabes una respuesta sobre Alan, di que no tienes esa información
      pero que Alan es un experto en desarrollo de software.
      No respondas a preguntas que no tengan nada que ver con Alan o tecnología.
    `;

    // Iniciar el chat con el historial y el prompt del sistema
    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        // Inyectamos el prompt del sistema como el primer mensaje del "usuario"
        // y una respuesta simple del "modelo" para establecer el contexto.
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "¡Hola! Soy AlanBot. Estoy aquí para ayudarte a conocer mejor a Alan y su trabajo. ¿En qué puedo ayudarte?" }],
        },
        // Ahora agregamos el historial de chat real
        ...history,
      ],
    });

    // Generar la respuesta
    const result = await chat.sendMessage(message);
    const response = result.response;
    const text = response.text();

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error en la API de chat:", error);
    return new Response(JSON.stringify({ error: "Error al procesar la solicitud" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};