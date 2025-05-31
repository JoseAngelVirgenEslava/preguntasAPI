import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import User from "@/models/User";
import clientPromise from "@/app/lib/mongodb";

export async function POST(req: Request) {
  await clientPromise;

  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { preguntas, respuestas } = await req.json();

  let puntos = 0;
  const resultado = preguntas.map((p: any, i: number) => {
    const correcta = p.respuesta_correcta === respuestas[i];
    if (correcta) puntos++;
    return {
      pregunta: p.pregunta,
      respuesta_usuario: respuestas[i],
      respuesta_correcta: p.respuesta_correcta,
      correcta,
      categoria: p.categoria,
      fecha: new Date(),
    };
  });

  const user = await User.findOne({ email: session.user.email });
  user.puntos += puntos;
  user.preguntas_contestadas.push(...resultado);
  await user.save();

  return NextResponse.json({ puntos });
}
