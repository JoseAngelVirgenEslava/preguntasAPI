"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Cuestionario from "@/app/Cuestionario/Cuestionario";

export default function PageCuestionario() {
  const [preguntas, setPreguntas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) {
      return;
    }

    const obtenerPreguntas = async () => {
      setCargando(true);
      setError(null);

      const categoriasParam = searchParams.get("categorias");
      const categoriasArray = categoriasParam && categoriasParam.toLowerCase() !== "todas" 
        ? categoriasParam.split(',') 
        : [];
      
      console.log("Categorías para la API (desde cuestionario/page.tsx):", categoriasArray);

      try {
        const res = await fetch("/api/gemini/generar-preguntas", {
          method: "POST",
          body: JSON.stringify({ 
            categorias: categoriasArray,
            cantidad: 10 
          }),
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `Error del servidor: ${res.status}` }));
          console.error("Error al obtener preguntas (respuesta no ok):", res.status, errorData);
          throw new Error(errorData.error || `Error del servidor: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.preguntas && data.preguntas.length > 0) {
          setPreguntas(data.preguntas);
        } else {
          console.warn("No se recibieron preguntas válidas de la API:", data);
          setPreguntas([]);
          setError("No se encontraron preguntas para las categorías seleccionadas o la API no devolvió preguntas.");
        }

      } catch (err: any) {
        console.error("Excepción en fetch de preguntas:", err);
        setPreguntas([]);
        setError(err.message || "Ocurrió un error al cargar las preguntas. Por favor, intenta de nuevo.");
      } finally {
        setCargando(false);
      }
    };

    obtenerPreguntas();
  }, [searchParams]);

  if (cargando) return <div className="p-4 text-xl text-center">Cargando preguntas...</div>;
  
  if (error) {
    return <div className="p-4 text-xl text-center text-red-500">Error: {error}</div>;
  }

  if (!preguntas || preguntas.length === 0) {
    return <div className="p-4 text-xl text-center">No hay preguntas disponibles para mostrar.</div>;
  }

  return <Cuestionario preguntas={preguntas} />;
}
