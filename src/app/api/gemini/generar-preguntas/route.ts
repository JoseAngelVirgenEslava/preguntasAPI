// src/app/api/gemini/generar-preguntas/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const categorias = body.categorias || [];
    const cantidad = body.cantidad || 10;

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

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      // Opcional: Configuración de seguridad, ajusta según necesidad
      // safetySettings: [
      //   { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      //   { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      //   { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      //   { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      // ],
    });

    console.log("Enviando prompt a Gemini API...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    console.log("Respuesta recibida de Gemini API.");

    const textFromGemini = response.text();

    if (response.promptFeedback?.blockReason) {
      console.error("Contenido bloqueado por Gemini:", response.promptFeedback);
      return NextResponse.json(
        { error: "La solicitud fue bloqueada por filtros de seguridad.", details: response.promptFeedback },
        { status: 400 }
      );
    }

    if (!textFromGemini) {
      console.error("Respuesta vacía de Gemini, no bloqueada explícitamente. Respuesta completa:", response);
      return NextResponse.json(
        { error: "La API de Gemini no devolvió contenido de texto." },
        { status: 500 }
      );
    }

    console.log("Texto RAW recibido de Gemini:", textFromGemini.substring(0, 250) + "...");

    // --- INICIO DE LÓGICA DE LIMPIEZA MEJORADA ---
    let jsonString = textFromGemini;

    // Usar una expresión regular para extraer el contenido dentro de ```json ... ``` o ``` ... ```
    // Esto es más robusto que contar caracteres con substring.
    // La regex busca:
    // 1. ```json (con posible espacio después) seguido de cualquier caracter (incluyendo saltos de línea, no codicioso) hasta el próximo ```
    // 2. O (si no encuentra ```json) solo ``` seguido de cualquier caracter hasta el próximo ```
    const markdownBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = jsonString.match(markdownBlockRegex);

    if (match && match[1]) {
      // Si la regex encuentra una coincidencia, match[1] contendrá el JSON (o lo que esté dentro de los ```)
      jsonString = match[1];
    }
    // Si no hay bloque Markdown, se asume que textFromGemini ya es el JSON (o está muy cerca)

    jsonString = jsonString.trim(); // Quitar espacios/saltos de línea al inicio/final

    // Como una capa adicional de robustez, intentamos extraer explícitamente el array JSON principal.
    // Esto ayuda si el modelo añade algún texto introductorio o final incluso después de la limpieza del bloque Markdown.
    const firstBracket = jsonString.indexOf('[');
    const lastBracket = jsonString.lastIndexOf(']');

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        jsonString = jsonString.substring(firstBracket, lastBracket + 1);
    } else {
        // Si después de la limpieza no encontramos un array JSON claro, podría haber un problema.
        // Sin embargo, el JSON.parse de abajo lo detectará si no es un JSON válido.
        console.warn("No se pudo aislar un array JSON ([...]) claramente después de la limpieza inicial. Se intentará parsear tal cual.");
    }
    
    jsonString = jsonString.trim(); // Un último trim por si acaso.
    // --- FIN DE LÓGICA DE LIMPIEZA MEJORADA ---

    console.log("Texto FINAL para parsear:", jsonString.substring(0, 250) + "...");

    try {
      const preguntas = JSON.parse(jsonString);
      return NextResponse.json({ preguntas });
    } catch (parseError: any) {
      console.error("Error al parsear JSON de Gemini (después de limpiar):", parseError.message);
      console.error("Texto FINAL que no se pudo parsear:", jsonString); // Loguea el texto completo si falla el parseo
      return NextResponse.json({ error: "Error al parsear la respuesta de Gemini (no es JSON válido)", rawResponse: jsonString, details: parseError.message }, { status: 500 });
    }

  } catch (e: any) {
    console.error("ERROR DETALLADO en API /api/gemini/generar-preguntas:", e);
    
    let errorMessage = "Error desconocido al generar preguntas.";
    let errorDetails = e.stack || (typeof e === 'object' ? JSON.stringify(e) : String(e));
    let statusCode = 500;

    if (e.message && e.message.includes("GoogleGenerativeAI Error")) {
        errorMessage = `Error de Google Generative AI: ${e.message}`;
        if (e.httpErrorCode) statusCode = e.httpErrorCode;
    } else if (e.response && e.response.data) {
        errorMessage = `Error en la solicitud a la API: ${e.response.data.error?.message || errorMessage}`;
        errorDetails = JSON.stringify(e.response.data);
        statusCode = e.response.status || statusCode;
    }

    return NextResponse.json({
      error: "Fallo al generar preguntas desde la API de Gemini.",
      details: errorMessage,
      fullErrorForDebugging: errorDetails
    }, { status: statusCode });
  }
}
