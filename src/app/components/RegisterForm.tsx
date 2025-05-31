"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError("");
    const { name, email, password, age } = form;
    const preguntas = 0;
    const puntos = 0;
    if (!name || !email || !password || !age) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, age, preguntas, puntos }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al registrar.");
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/",
      });
    } catch (err) {
      setError("Error del servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Crear Cuenta</h2>

      <div className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Nombre"
          className="w-full px-4 py-2 border rounded-lg"
          value={form.name}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Correo"
          className="w-full px-4 py-2 border rounded-lg"
          value={form.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          className="w-full px-4 py-2 border rounded-lg"
          value={form.password}
          onChange={handleChange}
        />
        <input
          type="number"
          name="age"
          placeholder="Edad"
          className="w-full px-4 py-2 border rounded-lg"
          value={form.age}
          onChange={handleChange}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          onClick={handleRegister}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Registrando..." : "Crear cuenta"}
        </button>

        <div className="text-center text-gray-500 text-sm">o</div>

        <button
          onClick={handleGoogle}
          className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
        >
          Registrarse con Google
        </button>
      </div>
    </div>
  );
}
