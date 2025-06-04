import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import User from '@/models/User';
import dbConnect from '@/lib/mongooseConnect';

// Definición de tipos para las preguntas que vienen en el request body
interface PreguntaBaseAPI {
  pregunta: string;
  respuesta_correcta: string;
  categoria: string;
  tipo_pregunta: "opcion_multiple" | "respuesta_codigo_corta";
}

interface OpcionMultiplePreguntaAPI extends PreguntaBaseAPI {
  opciones: string[];
  tipo_pregunta: "opcion_multiple";
}

interface RespuestaCodigoPreguntaAPI extends PreguntaBaseAPI {
  tipo_pregunta: "respuesta_codigo_corta";
  opciones?: never;
}

type PreguntaAPI = OpcionMultiplePreguntaAPI | RespuestaCodigoPreguntaAPI;

export async function POST(req: Request) {
  try {
    await dbConnect(); // Conectar a la base de datos
    console.log("MongoDB connection established for /api/cuestionario/evaluar");

    // const session = await getServerSession(authOptions); // Si usas authOptions personalizadas
    const session = await getServerSession();
    if (!session?.user?.email) {
      console.log("Intento de acceso no autorizado a /api/cuestionario/evaluar");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.log("Sesión recuperada para el usuario:", session.user.email);

    const body = await req.json();
    const preguntasEnviadas: PreguntaAPI[] = body.preguntas;
    const respuestasUsuario: string[] = body.respuestas;

    if (!preguntasEnviadas || !respuestasUsuario || preguntasEnviadas.length !== respuestasUsuario.length) {
      console.log("Datos de entrada inválidos: preguntas o respuestas faltantes o con longitudes diferentes.");
      return NextResponse.json({ error: "Datos de entrada inválidos." }, { status: 400 });
    }
    console.log(`Recibidas ${preguntasEnviadas.length} preguntas y ${respuestasUsuario.length} respuestas.`);

    let puntos = 0;
    const resultadoDetallado = preguntasEnviadas.map((p, i) => {
      let esCorrecta = false;
      const respuestaUsuarioActual = respuestasUsuario[i] || "";

      if (p.tipo_pregunta === "opcion_multiple") {
        esCorrecta = p.respuesta_correcta === respuestaUsuarioActual;
      } else if (p.tipo_pregunta === "respuesta_codigo_corta") {
        esCorrecta = p.respuesta_correcta.trim().toLowerCase() === respuestaUsuarioActual.trim().toLowerCase();
      }

      if (esCorrecta) puntos++;

      return {
        pregunta: p.pregunta,
        tipo_pregunta: p.tipo_pregunta,
        respuesta_usuario: respuestaUsuarioActual,
        respuesta_correcta: p.respuesta_correcta,
        correcta: esCorrecta,
        categoria: p.categoria,
        opciones: (p as OpcionMultiplePreguntaAPI).opciones || null, // Guardar opciones si existen
        fecha: new Date(),
      };
    });
    console.log("Resultados detallados calculados. Puntos obtenidos:", puntos);

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log(`Usuario no encontrado en la BD: ${session.user.email}`);
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    console.log(`Usuario encontrado: ${user.email}. Puntos actuales: ${user.puntos}`);

    user.puntos = (user.puntos || 0) + puntos;
    if (!Array.isArray(user.preguntas_contestadas)) {
      user.preguntas_contestadas = [];
    }
    user.preguntas_contestadas.push(...resultadoDetallado);

    await user.save();
    console.log(`Datos del usuario guardados. Nuevos puntos totales: ${user.puntos}`);

    return NextResponse.json({
      puntos,
      totalPreguntas: preguntasEnviadas.length,
      resultadoDetallado
    });


  } catch (error: any) {
    console.error("Error catastrófico en /api/cuestionario/evaluar:", error);
    const errorMessage = error.message || "Ocurrió un error procesando la solicitud.";
    return NextResponse.json({ error: "Error interno del servidor", details: errorMessage, stack: error.stack }, { status: 500 });
  }
}
