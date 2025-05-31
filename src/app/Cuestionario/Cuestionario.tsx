"use client";

import { useState } from "react";

export default function Cuestionario({ preguntas }: { preguntas: any[] }) {
  const [respuestas, setRespuestas] = useState<string[]>(Array(preguntas.length).fill(""));
  const [seccionActual, setSeccionActual] = useState(0);

  const seleccionarRespuesta = (index: number, respuesta: string) => {
    const nuevas = [...respuestas];
    nuevas[index] = respuesta;
    setRespuestas(nuevas);
  };

  return (
    <div>
      {/* Barra superior */}
      <div className="flex gap-2 p-2 overflow-x-auto bg-gray-200">
        {preguntas.map((_, i) => (
          <button
            key={i}
            className={`p-2 rounded ${seccionActual === i ? "bg-blue-500 text-white" : "bg-white"}`}
            onClick={() => setSeccionActual(i)}
          >
            Pregunta {i + 1}
          </button>
        ))}
      </div>

      {/* Pregunta actual */}
      <div className="p-4">
        <h2 className="text-xl font-bold">{preguntas[seccionActual].pregunta}</h2>
        <ul className="mt-4 space-y-2">
          {preguntas[seccionActual].opciones.map((op: string, idx: number) => (
            <li key={idx}>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`pregunta-${seccionActual}`}
                  value={op}
                  checked={respuestas[seccionActual] === op}
                  onChange={() => seleccionarRespuesta(seccionActual, op)}
                />
                {op}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Botón de enviar */}
      {seccionActual === preguntas.length - 1 && (
        <button
          onClick={async () => {
            const resp = await fetch("/api/cuestionario/evaluar", {
              method: "POST",
              body: JSON.stringify({ preguntas, respuestas }),
              headers: { "Content-Type": "application/json" },
            });

            const data = await resp.json();
            alert(`Obtuviste ${data.puntos} puntos.`);
          }}
          className="mt-4 bg-green-500 text-white p-2 rounded"
        >
          Enviar cuestionario
        </button>
      )}
    </div>
  );
}
