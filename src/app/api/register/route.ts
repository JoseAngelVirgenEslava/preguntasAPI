import { NextRequest } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password, age, questions, points } = await req.json();

    if (!email || !name || !password || !age) {
      return Response.json({ message: "Faltan campos" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("usuarios");

    const existing = await users.findOne({ email });
    if (existing) {
      return Response.json({ message: "El usuario ya existe" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await users.insertOne({
      email,
      name,
      password: hashedPassword,
      age,
      provider: "credentials",
      createdAt: new Date(),
      preguntas_contestadas: questions,
      puntos: points
    });

    return Response.json({ message: "Usuario registrado con éxito" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Error del servidor" }, { status: 500 });
  }
}
