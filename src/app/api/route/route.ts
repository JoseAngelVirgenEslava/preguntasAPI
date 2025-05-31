import clientPromise from "@/app/lib/mongodb";
import { NextRequest } from "next/server";

export async function GET() {
  const client = await clientPromise;
  const db = client.db("sitio");
  const users = await db.collection("usuarios").find().toArray();

  return Response.json(users);
}

export async function POST(req: NextRequest) {
  const client = await clientPromise;
  const db = client.db("sitio");

  const data = await req.json();
  const result = await db.collection("usuarios").insertOne(data);

  return Response.json({ insertedId: result.insertedId });
}