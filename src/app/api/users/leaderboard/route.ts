import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongooseConnect";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    const topUsers = await User.find({})
      .sort({ puntos: -1 })
      .select("name puntos");

    return NextResponse.json(topUsers);
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Error al obtener el leaderboard", details: error.message },
      { status: 500 }
    );
  }
}