"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Cuestionario from "@/app/Cuestionario/Cuestionario";

export default function PageCuestionario() {
  const [preguntas, setPreguntas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const obtenerPreguntas = async () => {
      const categorias = searchParams.getAll("categoria");
      const res = await fetch("/api/gemini/generar-preguntas", {
        method: "POST",
        body: JSON.stringify({ categorias, cantidad: 10 }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setPreguntas(data.preguntas || []);
      setCargando(false);
    };

    obtenerPreguntas();
  }, []);

  if (cargando) return <div className="p-4 text-xl">Cargando preguntas...</div>;

  return <Cuestionario preguntas={preguntas} />;
}
