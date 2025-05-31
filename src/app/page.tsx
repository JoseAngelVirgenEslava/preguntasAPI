'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      redirect: true,
      email,
      password,
      callbackUrl: "/",
    });
  };

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="w-full max-w-md p-6 rounded-lg bg-zinc-900 shadow-md">
        <h1 className="text-3xl font-bold mb-4">Sign In</h1>
        <p className="text-zinc-400 mb-6">Enter your email and password</p>

        <form onSubmit={handleCredentialsSignIn}>
          <label>Email</label>
          <input
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