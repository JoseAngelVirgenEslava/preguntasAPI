import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { categorias, cantidad } = await req.json();

  const prompt = `Genera ${cantidad} preguntas de opción múltiple sobre las siguientes categorías: ${categorias.join(", ")}. Para cada pregunta, incluye la respuesta correcta. Devuelve el resultado en formato JSON, así:

[
  {
    "pregunta": "...",
    "opciones": ["...", "...", "...", "..."],
    "respuesta_correcta": "...",
    "categoria": "..."
  },
  ...
]`;

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  const text = await result.response.text();

  try {
    const preguntas = JSON.parse(text);
    return NextResponse.json({ preguntas });
  } catch (e) {
    return NextResponse.json({ error: "Error al parsear respuesta de Gemini", raw: text }, { status: 500 });
  }
}
