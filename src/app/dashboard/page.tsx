"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const categoriasDisponibles = [
  "Matemáticas",
  "Historia",
  "Ciencia",
  "Literatura",
  "Arte",
  "Tecnología",
  "Programación",
];

interface LeaderboardUser {
  _id: string;
  name?: string | null;
  email: string;
  puntos: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [lastQuizPoints, setLastQuizPoints] = useState<string | null>(null);
  const [lastQuizCount, setLastQuizCount] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (searchParams) {
      const points = searchParams.get("lastQuizPoints");
      const count = searchParams.get("lastQuizCount");
      if (points) setLastQuizPoints(points);
      if (count) setLastQuizCount(count);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const res = await fetch("/api/users/leaderboard");
        if (!res.ok) throw new Error("Error al cargar el leaderboard");
        const data = await res.json();
        setLeaderboard(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setLeaderboard([]);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const toggleCategoria = (categoria: string) => {
    setCategoriasSeleccionadas(prev => 
      prev.includes(categoria) ? prev.filter(c => c !== categoria) : [...prev, categoria]
    );
  };

  const iniciarCuestionario = () => {
    const categoriasQuery = categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas.join(",") : "todas";
    router.push(`/cuestionario?page=1&categorias=${encodeURIComponent(categoriasQuery)}`);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };
  if (status === "loading") return <p className="text-center mt-10">Cargando sesión...</p>;
  if (status !== "authenticated" || !session) {
    return <p className="text-center mt-10">Verificando sesión...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">¡Bienvenido, {session.user?.name || session.user?.email}!</h1>
          {session.user?.image && (
              <img src={session.user.image} alt="Avatar" className="w-16 h-16 rounded-full" />
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150 ease-in-out self-start sm:self-auto"
        >
          Cerrar Sesión
        </button>
      </div>

      {lastQuizPoints !== null && lastQuizCount !== null && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md shadow-md">
          <h3 className="font-bold text-lg mb-1">Resultados de tu último cuestionario:</h3>
          <p>Puntos obtenidos: {lastQuizPoints}</p>
          <p>Preguntas contestadas: {lastQuizCount}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-4">Iniciar Nuevo Cuestionario</h2>
          <p className="text-gray-600 mb-1">Selecciona las categorías (opcional):</p>
          <p className="text-sm text-gray-500 mb-4">(Si no seleccionas ninguna, se incluirán preguntas de todas las categorías)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {categoriasDisponibles.map((categoria) => (
              <button
                key={categoria}
                className={`border px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                  categoriasSeleccionadas.includes(categoria) 
                    ? "bg-blue-500 text-white border-blue-500" 
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
                onClick={() => toggleCategoria(categoria)}
              >
                {categoria}
              </button>
            ))}
          </div>
          <button
            onClick={iniciarCuestionario}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-150 text-lg font-semibold"
          >
            Comenzar Cuestionario
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-4">🏆 Leaderboard</h2>
          {loadingLeaderboard ? (
            <p className="text-gray-500">Cargando leaderboard...</p>
          ) : leaderboard.length > 0 ? (
            <ul className="space-y-3">
              {leaderboard.map((user, index) => (
                <li key={user._id || user.email} className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-800">{index + 1}. {user.name || user.email}</span>
                  <span className="text-blue-600 font-bold">{user.puntos} puntos</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No hay datos en el leaderboard aún.</p>
          )}
        </div>
      </div>
    </div>
  );
}
