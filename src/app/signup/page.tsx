"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { signUp, organization } from "@/lib/auth-client";

export default function SignupPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useGSAP(() => {
    gsap.from(".fade-in", {
      opacity: 0,
      y: 20,
      duration: 1.2,
      stagger: 0.08,
      ease: "power3.out",
    });
  }, { scope: containerRef });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
  
      const { error: signUpError } = await signUp.email({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      if (signUpError) {
        setError(signUpError.message ?? "Signup failed");
        setLoading(false);
        return;
      }

      const slug = form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const { error: orgError } = await organization.create({
        name: form.name,
        slug,
      });

      if (orgError) {
        setError(orgError.message ?? "Failed to create organization");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/onboarding/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to set up your workspace");
        setLoading(false);
        return;
      }

   
router.push(`/t/${slug}/dashboard`);

    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black text-white flex items-center justify-center px-6"
    >
      <Navbar />
      <div className="w-full max-w-md space-y-10">

        <div className="space-y-2">
          <h1 className="text-center fade-in text-5xl font-light tracking-tight text-white uppercase leading-tight">
            Sign Up
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>

          {error && (
            <div className="text-red-400 text-sm text-center border border-red-800 py-2 px-4 rounded">
              {error}
            </div>
          )}

          <div className="fade-in space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-normal block">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full bg-transparent border-b border-zinc-800 focus:border-white outline-none py-3 text-sm text-white placeholder-zinc-700 transition-colors duration-200"
            />
          </div>

          <div className="fade-in space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-normal block">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full bg-transparent border-b border-zinc-800 focus:border-white outline-none py-3 text-sm text-white placeholder-zinc-700 transition-colors duration-200"
            />
          </div>

          <div className="fade-in space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-normal block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full bg-transparent border-b border-zinc-800 focus:border-white outline-none py-3 pr-10 text-sm text-white placeholder-zinc-700 transition-colors duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="fade-in pt-2">
            <button
              type="submit"
              disabled={loading}
              className="relative w-full text-sm uppercase tracking-widest font-medium px-8 py-4 bg-white text-black border border-white overflow-hidden transition-colors duration-300 before:absolute before:inset-0 before:translate-y-full before:bg-black hover:before:translate-y-0 before:transition-transform before:duration-300 hover:text-white z-0 before:-z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting up..." : "Sign up"}
            </button>
          </div>

        </form>

        <p className="text-center fade-in text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline transition-all">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}