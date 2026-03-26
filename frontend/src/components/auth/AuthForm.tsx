"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authApi } from "@/lib/api";
import { colors } from "@/lib/theme";
import catImg from "@/assets/cat.png";
import cactusImg from "@/assets/cactus.png";

type Props = {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await authApi.signup(email, password);
      } else {
        await authApi.login(email, password);
      }
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      console.log(err);
      const msg =
        (err as Record<string, string[]>)?.email?.[0] ||
        (err as Record<string, string[]>)?.password?.[0] ||
        (err as { detail?: string })?.detail ||
        "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: colors.bg }}
    >


      {/* Form */}
      <div className="w-full max-w-sm px-6 z-10">
        <div className="flex justify-center mb-4">
          <Image
            src={mode === "signup" ? catImg : cactusImg}
            alt={mode === "signup" ? "Cat" : "Cactus"}
            className={`object-contain ${mode === "signup" ? "w-56 h-56 -mb-16" : "w-28 h-28"}`}
          />
        </div>
        <h1
          className="text-5xl text-center mb-10 font-serif"
          style={{ color: colors.text, fontWeight: 600 }}
        >
          {mode === "signup" ? "Yay, New Friend!" : "Yay, You're Back!"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-5 py-3 rounded-full text-sm"
            style={{ border: `1.5px solid ${colors.border}`, color: colors.text }}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-3 rounded-full text-sm pr-12"
              style={{ border: `1.5px solid ${colors.border}`, color: colors.text }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
              style={{ color: colors.textMuted }}
            >
              {showPassword ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p className="text-center text-sm" style={{ color: "#C0392B" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full text-sm font-medium mt-3 transition-opacity hover:opacity-75 disabled:opacity-50"
            style={{ border: `1.5px solid ${colors.border}`, color: colors.text }}
          >
            {loading ? "…" : mode === "signup" ? "Sign Up" : "Login"}
          </button>

          <Link
            href={mode === "signup" ? "/login" : "/signup"}
            className="text-center text-sm underline mt-1 transition-opacity hover:opacity-70"
            style={{ color: colors.textMuted }}
          >
            {mode === "signup"
              ? "We're already friends!"
              : "Oops! I've never been here before"}
          </Link>
        </form>
      </div>
    </div>
  );
}
