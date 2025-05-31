import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

export default async function Dashboard() {
  await connectDB();
  const session = await getServerSession(authOptions);
  const user = await User.findOne({ email: session?.user?.email });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bienvenido, {session?.user?.name}</h1>
      <p className="mb-6 text-lg">Puntos totales: <strong>{user.puntos}</strong></p>

      <h2 className="text-xl font-semibold mb-2">Historial de preguntas</h2>
      <ul className="space-y-2 max-h-[400px] overflow-auto">
        {user.preguntas_contestadas.slice(-20).reverse().map((p: any, i: number) => (
          <li key={i} className="border p-3 rounded bg-white">
            <p><strong>{p.pregunta}</strong></p>
            <p>Tu respuesta: <span className={p.correcta ? "text-green-600" : "text-red-600"}>{p.respuesta_usuario}</span></p>
            {!p.correcta && <p>Respuesta correcta: <strong>{p.respuesta_correcta}</strong></p>}
            <p className="text-sm text-gray-500">Categoría: {p.categoria} | {new Date(p.fecha).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
