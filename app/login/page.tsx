"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }

      // On success, go to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      {/* Header/nav (same style as homepage) */}
      <header
        style={{
          borderBottom: "1px solid #e5e7eb",
          marginBottom: 24,
          background: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
            }}
          >
            <img
              src="/logo.png"
              alt="Broken Bats Hitting Club logo"
              style={{ width: 160, height: 160, objectFit: "contain" }}
            />
          </Link>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              fontSize: 14,
            }}
          >
            <Link href="/" style={{ textDecoration: "none", color: "#111827" }}>
              Home
            </Link>
            <Link
              href="/about-us"
              style={{ textDecoration: "none", color: "#111827" }}
            >
              About Us
            </Link>
            <Link
              href="/swing-lab"
              style={{ textDecoration: "none", color: "#111827" }}
            >
              Swing Lab
            </Link>
            <Link
              href="/drills"
              style={{ textDecoration: "none", color: "#111827" }}
            >
              Drills
            </Link>
            <Link
              href="/login"
              style={{ textDecoration: "none", color: "#111827" }}
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Login / Signup card */}
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px 40px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#ffffff",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontSize: 22,
            }}
          >
            {mode === "login" ? "Login" : "Create an Account"}
          </h1>
          <p
            style={{
              marginTop: 0,
              marginBottom: 16,
              fontSize: 14,
              color: "#4b5563",
            }}
          >
            Use your email and password to{" "}
            {mode === "login" ? "log in to future uploads." : "get started."}
          </p>

          {/* Mode toggle */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            <button
              type="button"
              onClick={() => setMode("login")}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 999,
                border:
                  mode === "login"
                    ? "1px solid #111827"
                    : "1px solid #d1d5db",
                background: mode === "login" ? "#111827" : "#ffffff",
                color: mode === "login" ? "#f9fafb" : "#111827",
                cursor: "pointer",
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 999,
                border:
                  mode === "signup"
                    ? "1px solid #111827"
                    : "1px solid #d1d5db",
                background: mode === "signup" ? "#111827" : "#ffffff",
                color: mode === "signup" ? "#f9fafb" : "#111827",
                cursor: "pointer",
              }}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: "8px 10px",
                background: "#fef2f2",
                borderRadius: 6,
                border: "1px solid #ef4444",
                color: "#991b1b",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div>
              <label
                htmlFor="email"
                style={{ display: "block", fontSize: 13, marginBottom: 4 }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                style={{ display: "block", fontSize: 13, marginBottom: 4 }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                padding: "10px 0",
                borderRadius: 999,
                border: "none",
                background: "#111827",
                color: "#f9fafb",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {loading
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                ? "Log In"
                : "Sign Up"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
