'use client';

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit fue llamado");
    console.log("Email para enviar:", email);
    console.log("Password para enviar:", password ? "********" : "(vacío)");

    if (!email || !password) {
      console.error("Email o contraseña están vacíos. No se llamará a signIn.");
      return;
    }
    try {
      console.log("Intentando llamar a signIn...");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/dashboard",
      });
      console.log("Resultado de signIn (cliente):", result);

      if (result?.error) {
        console.error("Error devuelto por signIn (cliente):", result.error);
      }
      if (!result?.ok) {
        console.warn("La operación de signIn no fue 'ok'. Resultado:", result)
      }

    } catch (error) {
      console.error("Error al ejecutar signIn:", error);
    }
  };

  useEffect(() => {
    const formElement = document.getElementById('login-form');
    if (formElement) {
      const testSubmitEvent = (e: Event) => {
        console.log(">>> Evento 'submit' del DOM FORMULARIO disparado!", e.type);
      };
      formElement.addEventListener('submit', testSubmitEvent);
      return () => {
        formElement.removeEventListener('submit', testSubmitEvent);
      };
    } else {
      console.warn("Elemento del formulario 'login-form' no encontrado para el listener del DOM.");
    }
  }, []);

  const handleGoogleSignIn = async () => {
    console.log("Intentando iniciar sesión con Google...");
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="w-full max-w-md p-6 rounded-lg bg-zinc-900 shadow-md">
        <h1 className="text-3xl font-bold mb-4">Sign In</h1>
        <p className="text-zinc-400 mb-6">Enter your email and password</p>

        <form onSubmit={handleSubmit} id="login-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="w-full p-3 my-2 bg-zinc-800 rounded-md text-white"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label>Password</label>
          <input
            className="w-full p-3 my-2 bg-zinc-800 rounded-md text-white"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-white text-zinc-950 py-3 mt-4 rounded-md hover:bg-white/90"
            onClick={() => console.log(">>> BOTÓN DE SUBMIT CLICKEADO!")}
          >
            Sign in with Email
          </button>
        </form>

        <div className="my-4 flex items-center">
          <div className="flex-grow border-t border-zinc-700" />
          <span className="px-2 text-zinc-400 text-sm">or</span>
          <div className="flex-grow border-t border-zinc-700" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full border border-zinc-800 py-3 rounded-md flex justify-center items-center hover:bg-zinc-800"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42v-.1H24v8h11.3..." />
          </svg>
          Sign in with Google
        </button>

        <div className="mt-6 text-sm text-zinc-400">
          <a href="/forgot" className="underline">Forgot password?</a> | <a href="/register" className="underline">Create account</a>
        </div>
      </div>
    </div>
  );
}