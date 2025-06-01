"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const categoriasDisponibles = [
  "Matemáticas",
  "Historia",
  "Ciencia",
  "Literatura",
  "Arte",
  "Tecnología",
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const toggleCategoria = (categoria: string) => {
    if (categoriasSeleccionadas.includes(categoria)) {
      setCategoriasSeleccionadas(categoriasSeleccionadas.filter(c => c !== categoria));
    } else {
      setCategoriasSeleccionadas([...categoriasSeleccionadas, categoria]);
    }
  };

  const iniciarCuestionario = () => {
    const categorias = categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas.join(",") : "todas";
    router.push(`/cuestionario?page=1&categorias=${encodeURIComponent(categorias)}`);
  };

  if (status === "loading") return <p>Cargando sesión...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">¡Bienvenido, {session?.user?.name}!</h1>
      <img src={session?.user?.image ?? ""} alt="Avatar" className="w-16 h-16 rounded-full mb-6" />

      <h2 className="text-xl font-semibold mb-2">Selecciona las categorías (opcional):</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {categoriasDisponibles.map((categoria) => (
          <button
            key={categoria}
            className={`border px-4 py-2 rounded-lg ${
              categoriasSeleccionadas.includes(categoria) ? "bg-blue-500 text-white" : "bg-white text-black"
            }`}
            onClick={() => toggleCategoria(categoria)}
          >
            {categoria}
          </button>
        ))}
      </div>

      <button
        onClick={iniciarCuestionario}
        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
      >
        Comenzar Cuestionario
      </button>
    </div>
  );
}