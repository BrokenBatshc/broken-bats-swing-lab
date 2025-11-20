"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // ✅ after successful login, go to dashboard
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>{mode === "login" ? "Login" : "Create an Account"}</h1>
      <p style={{ marginBottom: 16 }}>
        Use your email and password to{" "}
        {mode === "login" ? "log in to" : "create a Broken Bats Swing Lab account for"}{" "}
        future uploads.
      </p>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setMode("login")}
          disabled={mode === "login"}
          style={{ marginRight: 8 }}
        >
          Login
        </button>
        <button
          onClick={() => setMode("signup")}
          disabled={mode === "signup"}
        >
          Sign Up
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320 }}
      >
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading
            ? "Working..."
            : mode === "login"
            ? "Log In"
            : "Create Account"}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 16, color: "green" }}>{message}</p>
      )}
      {error && (
        <p style={{ marginTop: 16, color: "red" }}>{error}</p>
      )}
    </div>
  );
}
