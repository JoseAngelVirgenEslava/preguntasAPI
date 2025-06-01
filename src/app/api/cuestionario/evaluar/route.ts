// src/app/api/cuestionario/evaluar/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import User from "@/models/User"; // Asumiendo que tu modelo se exporta como default
import dbConnect from "@/lib/mongooseConnect"; // Importa la utilidad de conexión

export async function POST(req: Request) {
  try {
    await dbConnect(); // Asegura la conexión a MongoDB a través de Mongoose
    console.log("MongoDB connection established for /api/cuestionario/evaluar");

    const session = await getServerSession(); // Considera pasar authOptions si las tienes personalizadas
    if (!session?.user?.email) {
      console.log("Unauthorized access attempt to /api/cuestionario/evaluar");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.log("Session retrieved for user:", session.user.email);

    const { preguntas, respuestas } = await req.json();
    console.log("Received preguntas count:", preguntas?.length);
    console.log("Received respuestas count:", respuestas?.length);


    if (!preguntas || !respuestas || preguntas.length !== respuestas.length) {
        console.log("Invalid input: preguntas or respuestas missing or length mismatch.");
        return NextResponse.json({ error: "Datos de entrada inválidos." }, { status: 400 });
    }

    let puntos = 0;
    const resultadoDetallado = preguntas.map((p: any, i: number) => {
      const correcta = p.respuesta_correcta === respuestas[i];
      if (correcta) puntos++;
      return {
        pregunta: p.pregunta,
        respuesta_usuario: respuestas[i],
        respuesta_correcta: p.respuesta_correcta,
        correcta,
        categoria: p.categoria, // Asegúrate de que 'categoria' venga en el objeto 'p'
        fecha: new Date(),
      };
    });

    console.log(`Finding user: ${session.user.email}`);
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      console.log(`User not found: ${session.user.email}`);
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    console.log(`User found. Current puntos: ${user.puntos}`);

    // Asegúrate de que user.puntos y user.preguntas_contestadas estén inicializados
    user.puntos = (user.puntos || 0) + puntos;
    if (!Array.isArray(user.preguntas_contestadas)) {
        user.preguntas_contestadas = [];
    }
    user.preguntas_contestadas.push(...resultadoDetallado);
    
    console.log(`Saving user. New puntos: ${user.puntos}, New preguntas_contestadas count: ${user.preguntas_contestadas.length}`);
    await user.save();
    console.log("User data saved successfully.");

    return NextResponse.json({ puntos });

  } catch (error: any) {
    console.error("Error en /api/cuestionario/evaluar:", error);
    // Considera loguear error.message o error.stack para más detalles
    return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 });
  }
}
