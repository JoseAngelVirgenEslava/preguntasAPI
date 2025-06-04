"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Definición de tipos para las preguntas (asumiendo que ya las tienes)
interface PreguntaBase {
  pregunta: string;
  respuesta_correcta: string;
  categoria: string;
  tipo_pregunta: "opcion_multiple" | "respuesta_codigo_corta";
}
interface OpcionMultiplePregunta extends PreguntaBase {
  opciones: string[];
  tipo_pregunta: "opcion_multiple";
}
interface RespuestaCodigoPregunta extends PreguntaBase {
  tipo_pregunta: "respuesta_codigo_corta";
  opciones?: never;
}
type Pregunta = OpcionMultiplePregunta | RespuestaCodigoPregunta;

export default function Cuestionario({ preguntas: preguntasIniciales }: { preguntas: Pregunta[] }) {
  const router = useRouter();
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [respuestas, setRespuestas] = useState<string[]>([]);
  const [seccionActual, setSeccionActual] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preguntasIniciales && preguntasIniciales.length > 0) {
      setPreguntas(preguntasIniciales);
      setRespuestas(Array(preguntasIniciales.length).fill(""));
      setSeccionActual(0);
    } else {
      setPreguntas([]);
      setRespuestas([]);
      setSeccionActual(0);
    }
  }, [preguntasIniciales]);

  const seleccionarRespuesta = (index: number, respuesta: string) => {
    const nuevasRespuestas = [...respuestas];
    nuevasRespuestas[index] = respuesta;
    setRespuestas(nuevasRespuestas);
  };

  if (!preguntas || preguntas.length === 0) {
    return <div className='p-4 text-center'>No hay preguntas disponibles o están cargando.</div>;
  }
  const preguntaActual = preguntas[seccionActual];
  if (!preguntaActual) {
    return <div className='p-4 text-center'>Cargando pregunta...</div>;
  }

  const handleSubmitCuestionario = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const resp = await fetch("/api/cuestionario/evaluar", {
        method: "POST",
        body: JSON.stringify({ preguntas, respuestas }),
        headers: { "Content-Type": "application/json" },
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: "Error desconocido al evaluar el cuestionario" }));
        throw new Error(errData.error || `Error del servidor: ${resp.status}`);
      }

      const data = await resp.json(); // data contiene { puntos, totalPreguntas, resultadoDetallado }

      const numPreguntasContestadas = data.totalPreguntas || preguntas.length;

      // Guardar la retroalimentación detallada en sessionStorage
      if (data.resultadoDetallado) {
        try {
          sessionStorage.setItem('lastQuizFeedback', JSON.stringify(data.resultadoDetallado));
        } catch (e) {
          console.error("Error guardando feedback en sessionStorage:", e);
          // Opcional: podrías pasar un error específico por URL si sessionStorage falla
        }
      }

      // Redirigir solo con puntos y conteo
      router.push(`/dashboard?lastQuizPoints=${data.puntos}&lastQuizCount=${numPreguntasContestadas}`);

    } catch (error: any) {
      console.error("Error al enviar cuestionario:", error);
      alert(`Error al enviar el cuestionario: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }


  };

  return (
    <div className='max-w-2xl mx-auto p-4'>
      <div className='flex gap-2 p-2 mb-4 overflow-x-auto bg-gray-100 rounded-md shadow'>
        {preguntas.map((_, i) => (
          <button
            key={`nav-q-${i}`}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${seccionActual === i ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-200"}`}
            onClick={() => setSeccionActual(i)}
          >
            Pregunta {i + 1}
          </button>
        ))}
      </div>

      {/* Contenedor de la pregunta actual */}

      <div className="p-6 bg-white rounded-lg shadow-xl">
        <p className="text-sm text-gray-500 mb-1">Categoría: {preguntaActual.categoria}</p>
        <h2 className="text-xl font-semibold mb-4 break-words">{preguntaActual.pregunta}</h2>

        {preguntaActual.tipo_pregunta === "opcion_multiple" ? (
          <ul className="mt-4 space-y-3">
            {(preguntaActual as OpcionMultiplePregunta).opciones.map((op: string, idx: number) => (
              <li key={`opt-${seccionActual}-${idx}`}>
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400">
                  <input
                    type="radio"
                    name={`pregunta-${seccionActual}`}
                    value={op}
                    checked={respuestas[seccionActual] === op}
                    onChange={() => seleccionarRespuesta(seccionActual, op)}
                    className="form-radio h-5 w-5 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-800">{op}</span>
                </label>
              </li>
            ))}
          </ul>
        ) : preguntaActual.tipo_pregunta === "respuesta_codigo_corta" ? (
          <textarea
            value={respuestas[seccionActual] || ""}
            onChange={(e) => seleccionarRespuesta(seccionActual, e.target.value)}
            placeholder="Escribe tu respuesta de código/texto aquí..."
            rows={8}
            className="w-full p-3 mt-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm font-mono"
            spellCheck="false"
          />
        ) : (
          <p className="text-red-500">Error: Tipo de pregunta no reconocido.</p>
        )}

      </div>

      {/* Navegación entre preguntas y botón de envío */}

      <div className="flex justify-between items-center mt-8">
        <button
          onClick={() => setSeccionActual(prev => Math.max(0, prev - 1))}
          disabled={seccionActual === 0}
          className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-60 transition-colors"
        >
          Anterior
        </button>

        {seccionActual < preguntas.length - 1 && (
          <button
            onClick={() => setSeccionActual(prev => Math.min(preguntas.length - 1, prev + 1))}
            className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Siguiente
          </button>
        )}

        {seccionActual === preguntas.length - 1 && (
          <button
            onClick={handleSubmitCuestionario}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors disabled:opacity-70"
          >
            {isSubmitting ? "Enviando..." : "Enviar Cuestionario"}
          </button>
        )}

      </div>
    </div>


  );
}