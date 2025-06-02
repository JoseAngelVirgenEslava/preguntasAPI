import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const categorias: string[] = body.categorias || [];
    const cantidad: number = body.cantidad || 10;

    let promptSegmentoCategorias = "";
    const esProgramacionSolo = categorias.length === 1 && categorias[0].toLowerCase() === "programación";
    const incluyeProgramacion = categorias.map(c => c.toLowerCase()).includes("programación");

    if (categorias.length === 0 || (categorias.length === 1 && categorias[0].toLowerCase() === "todas")) {
      promptSegmentoCategorias = `sobre temas generales variados. Todas deben ser de opción múltiple, usando "tipo_pregunta": "opcion_multiple".`;
    } else if (esProgramacionSolo) {
      promptSegmentoCategorias = `sobre Programación. Incluye una mezcla de preguntas teóricas de opción múltiple y preguntas prácticas que requieran escribir una línea de código o predecir un resultado simple como respuesta corta. Para las preguntas teóricas, usa "tipo_pregunta": "opcion_multiple". Para las preguntas prácticas de respuesta corta, usa "tipo_pregunta": "respuesta_codigo_corta" y no incluyas el campo "opciones".`;
    } else {
      let categoriasFiltradas = categorias.filter(c => c.toLowerCase() !== "programación");
      let textoCategorias = categoriasFiltradas.join(", ");

      if (incluyeProgramacion) {
        if (textoCategorias) {
          promptSegmentoCategorias = `sobre ${textoCategorias} y también preguntas teóricas de opción múltiple sobre Programación. Todas deben ser de opción múltiple, usando "tipo_pregunta": "opcion_multiple".`;
        } else {
          promptSegmentoCategorias = `sobre preguntas teóricas de opción múltiple sobre Programación. Todas deben ser de opción múltiple, usando "tipo_pregunta": "opcion_multiple".`;
        }
      } else {
        promptSegmentoCategorias = `sobre ${textoCategorias}. Todas deben ser de opción múltiple, usando "tipo_pregunta": "opcion_multiple".`;
      }
    }

    const prompt = `Genera ${cantidad} preguntas ${promptSegmentoCategorias}. Para cada pregunta, incluye la respuesta correcta. Devuelve el resultado en formato JSON.
Asegúrate de que cada objeto de pregunta en el JSON tenga un campo "tipo_pregunta" que sea "opcion_multiple" o "respuesta_codigo_corta".
Si "tipo_pregunta" es "opcion_multiple", incluye un array "opciones" con 4 opciones.
Si "tipo_pregunta" es "respuesta_codigo_corta", NO incluyas el array "opciones", y la "respuesta_correcta" será el string de código o texto esperado.
Cada pregunta debe tener un campo "categoria" que refleje la categoría solicitada.

Ejemplo de formato JSON:
[
  {
    "pregunta": "...",
    "opciones": ["...", "...", "...", "..."],
    "respuesta_correcta": "...",
    "categoria": "...",
    "tipo_pregunta": "opcion_multiple"
  },
  {
    "pregunta": "Escribe una función en Python que...",
    "respuesta_correcta": "def mi_funcion():...",
    "categoria": "Programacion",
    "tipo_pregunta": "respuesta_codigo_corta"
  }
]`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
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

    console.log("Texto RAW recibido de Gemini:", textFromGemini.substring(0, 300) + "...");

    let jsonStringToParse = textFromGemini.trim();
    const markdownBlockRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/m;
    const match = jsonStringToParse.match(markdownBlockRegex);

    if (match && match[1]) {
      jsonStringToParse = match[1].trim();
      console.log("Texto extraído del bloque Markdown (después de trim):", jsonStringToParse.substring(0, 300) + "...");
    } else {
      console.warn("No se detectó un bloque de código Markdown ```json ... ``` o ``` ... ``` que envuelva toda la respuesta. Se intentará encontrar un objeto o array JSON principal.");
      const firstCurly = jsonStringToParse.indexOf('{');
      const firstBracket = jsonStringToParse.indexOf('[');
      let start = -1;

      if (firstCurly === -1 && firstBracket === -1) {
        console.error("Respuesta de Gemini no parece contener JSON (no se encontró '{' ni '['):", jsonStringToParse);
        return NextResponse.json({ error: "Formato de respuesta de Gemini no reconocido como JSON.", rawResponse: textFromGemini }, { status: 500 });
      }

      if (firstCurly !== -1 && (firstBracket === -1 || firstCurly < firstBracket)) {
        start = firstCurly;
      } else {
        start = firstBracket;
      }

      const lastChar = jsonStringToParse.charAt(start) === '{' ? '}' : ']';
      const end = jsonStringToParse.lastIndexOf(lastChar);

      if (start !== -1 && end !== -1 && end > start) {
        jsonStringToParse = jsonStringToParse.substring(start, end + 1).trim();
        console.log("JSON aislado por delimitadores principales ({} o []):", jsonStringToParse.substring(0, 300) + "...");
      } else {
        console.error("No se pudo aislar una estructura JSON principal ({...} o [...]) en la respuesta:", jsonStringToParse);
      }
    }
    console.log("Texto FINAL para parsear:", jsonStringToParse.substring(0, 300) + "...");

    try {
      const preguntas = JSON.parse(jsonStringToParse);
      return NextResponse.json({ preguntas });
    } catch (parseError: any) {
      console.error("Error al parsear JSON de Gemini (después de TODA la limpieza):", parseError.message);
      console.error("Texto FINAL que no se pudo parsear:", jsonStringToParse);
      return NextResponse.json({ error: "Error al parsear la respuesta final de Gemini (no es JSON válido)", rawResponseForContext: textFromGemini, attemptedToParse: jsonStringToParse, details: parseError.message }, { status: 500 });
    }
  } catch (e: any) {
    console.error("ERROR DETALLADO en API /api/gemini/generar-preguntas:", e);
    let errorMessage = "Error desconocido al generar preguntas.";
    let errorDetails = e.stack || (typeof e === 'object' ? JSON.stringify(e) : String(e));
    let statusCode = 500;
  
    if (e.message && e.message.includes("GoogleGenerativeAI Error")) {
      errorMessage = `Error de Google Generative AI: ${e.message}`;
      if ((e as any).httpErrorCode) statusCode = (e as any).httpErrorCode;
    } else if ((e as any).response && (e as any).response.data) {
      errorMessage = `Error en la solicitud a la API: ${(e as any).response.data.error?.message || errorMessage}`;
      errorDetails = JSON.stringify((e as any).response.data);
      statusCode = (e as any).response.status || statusCode;
    }
    return NextResponse.json({ error: "Fallo al generar preguntas desde la API de Gemini.", details: errorMessage, fullErrorForDebugging: errorDetails }, { status: statusCode });
  }
}
