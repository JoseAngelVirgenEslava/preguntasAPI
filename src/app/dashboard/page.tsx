'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Lista de categorías disponibles para los cuestionarios
const categoriasDisponibles = [
  "Matemáticas",
  "Historia",
  "Ciencia",
  "Literatura",
  "Arte",
  "Tecnología",
  "Programación",
];

// Interfaz para los usuarios en el leaderboard
interface LeaderboardUser {
  _id: string;
  name?: string | null;
  email: string;
  puntos: number;
}

// Interfaz para cada ítem de la retroalimentación detallada
interface FeedbackItem {
  pregunta: string;
  respuesta_usuario: string;
  respuesta_correcta: string;
  correcta: boolean;
  categoria: string;
  tipo_pregunta: "opcion_multiple" | "respuesta_codigo_corta";
  opciones?: string[] | null;
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
  const [lastQuizFeedback, setLastQuizFeedback] = useState<FeedbackItem[] | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Efecto para redirigir si el usuario no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Efecto para leer los parámetros de la URL (puntos, conteo) y la retroalimentación de sessionStorage
  useEffect(() => {
    console.log("Dashboard: useEffect para searchParams y sessionStorage activado.");
    if (searchParams) {
      const points = searchParams.get("lastQuizPoints");
      const count = searchParams.get("lastQuizCount");

      console.log("Dashboard: Puntos de URL:", points, "Conteo de URL:", count);

      if (points) setLastQuizPoints(points);
      if (count) setLastQuizCount(count);

      // Intentar leer la retroalimentación desde sessionStorage
      try {
        const feedbackString = sessionStorage.getItem('lastQuizFeedback');
        console.log("Dashboard: Feedback string de sessionStorage:", feedbackString ? feedbackString.substring(0, 100) + "..." : null);

        if (feedbackString) {
          const parsedFeedback = JSON.parse(feedbackString);
          console.log("Dashboard: Feedback parseado:", parsedFeedback);
          setLastQuizFeedback(parsedFeedback as FeedbackItem[]);
          sessionStorage.removeItem('lastQuizFeedback'); // Limpiar después de leer
          console.log("Dashboard: 'lastQuizFeedback' eliminado de sessionStorage.");
          setFeedbackError(null);
        } else {
          console.log("Dashboard: No se encontró 'lastQuizFeedback' en sessionStorage.");
          // Solo resetea el feedback si no hay puntos/conteo, para evitar borrarlo si el usuario solo recarga.
          // Si hay puntos/conteo, y no hay feedback en session, es que no se guardó o ya se leyó.
          if (!points && !count) {
            setLastQuizFeedback(null);
          }
          setFeedbackError(null);
        }

      } catch (e) {
        console.error("Dashboard: Error leyendo/parseando feedback de sessionStorage:", e);
        setFeedbackError("Error al cargar la retroalimentación detallada desde el almacenamiento.");
        setLastQuizFeedback(null);
        sessionStorage.removeItem('lastQuizFeedback'); // Limpiar en caso de error de parseo
      }
    } else {
      console.log("Dashboard: searchParams es null en este render.");
    }


  }, [searchParams]); // Este efecto se ejecuta cuando searchParams cambia (o está disponible)

  // Efecto para cargar los datos del leaderboard
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
  }, []); // Se ejecuta solo una vez al montar el componente

  // Manejadores de eventos
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

  // Renderizado condicional basado en el estado de la sesión
  if (status === "loading") {
    return <p className='text-center mt-10 text-gray-600'>Cargando sesión...</p>;
  }
  if (status !== "authenticated" || !session) {
    return <p className='text-center mt-10 text-gray-600'>Verificando sesión...</p>;
  }

  // Renderizado principal del Dashboard
  return (
    <div className='max-w-4xl mx-auto p-4 sm:p-6 space-y-8'>
      <div className='flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-8'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-800 mb-2'>¡Bienvenido, {session.user?.name || session.user?.email}!</h1>
          {session.user?.image && (
            <img src={session.user.image} alt='Avatar del usuario' className='w-16 h-16 rounded-full shadow' />
          )}
        </div>
        <button
          onClick={handleSignOut}
          className='bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150 ease-in-out self-start sm:self-auto'
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Sección de Resultados del Último Cuestionario y Retroalimentación Detallada */}
      {(lastQuizPoints !== null || lastQuizFeedback !== null || feedbackError) && (
        <div className="bg-slate-50 border-l-4 border-slate-400 p-4 sm:p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-bold text-slate-700 mb-3">Resultados de tu Último Cuestionario</h3>
          {lastQuizPoints !== null && lastQuizCount !== null && (
            <div className="mb-4">
              <p className="text-gray-700"><span className="font-semibold">Puntos obtenidos:</span> {lastQuizPoints}</p>
              <p className="text-gray-700"><span className="font-semibold">Preguntas contestadas:</span> {lastQuizCount}</p>
            </div>
          )}

          {feedbackError && (
            <p className="text-red-600 font-semibold bg-red-100 p-3 rounded-md">{feedbackError}</p>
          )}

          {lastQuizFeedback && lastQuizFeedback.length > 0 && !feedbackError && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-slate-600 mb-3">Retroalimentación Detallada:</h4>
              <ul className="space-y-4">
                {lastQuizFeedback.map((item, index) => (
                  <li
                    key={`feedback-${index}`}
                    className={`p-4 rounded-md border ${item.correcta
                        ? 'bg-green-50 border-green-400 shadow-sm'
                        : 'bg-red-50 border-red-400 shadow-sm'
                      }`}
                  >
                    <p className="font-semibold text-gray-800 mb-1">
                      <span className="text-xs sm:text-sm text-gray-500 block">Pregunta {index + 1} (Categoría: {item.categoria})</span>
                      {item.pregunta}
                    </p>
                    <p className={`text-sm ${item.correcta ? 'text-green-700' : 'text-red-700'}`}>
                      Tu respuesta: <span className="font-medium break-all">{item.respuesta_usuario || "(No respondida)"}</span>
                      {item.correcta ?
                        <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-800 text-xs font-semibold rounded-full">Correcta</span> :
                        <span className="ml-2 px-2 py-0.5 bg-red-200 text-red-800 text-xs font-semibold rounded-full">Incorrecta</span>
                      }
                    </p>
                    {!item.correcta && (
                      <p className="text-sm text-gray-600 mt-1">
                        Respuesta correcta: <span className="font-medium break-all">{item.respuesta_correcta}</span>
                      </p>
                    )}
                    {item.tipo_pregunta === "opcion_multiple" && item.opciones && item.opciones.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="font-medium">Opciones eran:</span> {item.opciones.join(" / ")}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      )}

      {/* Secciones Principales: Iniciar Cuestionario y Leaderboard */}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Sección para Iniciar Nuevo Cuestionario */}
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Iniciar Nuevo Cuestionario</h2>
          <p className="text-gray-600 mb-1">Selecciona las categorías (opcional):</p>
          <p className="text-sm text-gray-500 mb-4">(Si no seleccionas ninguna, se incluirán preguntas de todas las categorías)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {categoriasDisponibles.map((categoria) => (
              <button
                key={categoria}
                className={`border px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${categoriasSeleccionadas.includes(categoria) ? "bg-blue-500 text-white border-blue-500 shadow-sm" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                onClick={() => toggleCategoria(categoria)}
              >
                {categoria}
              </button>
            ))}
          </div>
          <button
            onClick={iniciarCuestionario}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-150 text-lg font-semibold shadow-md"
          >
            Comenzar Cuestionario
          </button>
        </div>

        {/* Sección del Leaderboard */}
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🏆 Leaderboard</h2>
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