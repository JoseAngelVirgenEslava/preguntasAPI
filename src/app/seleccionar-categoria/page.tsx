"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIAS = [
  "Historia", "Ciencia", "Matemáticas", "Arte", "Deportes", "Tecnología",
];

export default function SeleccionarCategorias() {
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const router = useRouter();

  const toggleCategoria = (categoria: string) => {
    setSeleccionadas(prev =>
      prev.includes(categoria) ? prev.filter(c => c !== categoria) : [...prev, categoria]
    );
  };

  const comenzar = () => {
    const query = new URLSearchParams();
    seleccionadas.forEach(cat => query.append("categoria", cat));
    router.push(`/cuestionario?${query.toString()}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Selecciona una o más categorías</h1>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            onClick={() => toggleCategoria(cat)}
            className={`p-3 border rounded-lg ${
              seleccionadas.includes(cat) ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <button
        className="mt-6 bg-green-500 text-white p-3 rounded"
        onClick={comenzar}
        disabled={seleccionadas.length === 0}
      >
        Comenzar cuestionario
      </button>
    </div>
  );
}
