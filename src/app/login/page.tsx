"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import api from "@/lib/api";

// Maps each role name to where they should land after login
// const ROLE_ROUTES: Record<string, string> = {
//   Owner: "admin/dashboard",
//   Manager: "admin/dashboard",
//   Cashier: "cashier",
//   Waiter: "waiter",
//   "Kitchen Crew": "kitchen",
// };

const ROLE_ROUTES: Record<string, string> = {
  Owner: "org",
  Manager: "manager",
  Cashier: "pos/cashier",
  Waiter: "pos/waiter",
  "Kitchen Crew": "pos/kitchen",
};

function getRouteForRole(role: string | null): string {
  if (!role) return "pos/cashier";
  return ROLE_ROUTES[role] ?? "pos/cashier";
}

export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccessData, setLoginSuccessData] = useState<any>(null);

  const [form, setForm] = useState({ email: "", password: "" });

  useGSAP(
    () => {
      gsap.from(".fade-in", {
        opacity: 0,
        y: 20,
        duration: 1.2,
        stagger: 0.08,
        ease: "power3.out",
      });
    },
    { scope: containerRef },
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      const data = res.data;

      // ── Store auth state ──────────────────────────────────
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("activeOutletId", data.activeOutletId ?? "");
      localStorage.setItem("role", data.role ?? "");
      localStorage.setItem(
        "permissions",
        JSON.stringify(data.permissions ?? []),
      );

      // Trigger loading page transition
      setLoginSuccessData(data);

      setTimeout(() => {
        if (data.requiresOutletSelection) {
          router.push(`/t/${data.user.slug}/select-outlet`);
        } else {
          const targetPath = getRouteForRole(data.role);
          router.push(`/t/${data.user.slug}/${targetPath}`);
        }
      }, 4500);

    } catch (err: any) {
      const apiError = err.response?.data?.error;
      const message =
        typeof apiError === "string" ? apiError : "Invalid email or password";
      setError(message);
      setLoading(false);
    }
    
  }

  if (loginSuccessData) {
    const slug = loginSuccessData.user.slug;
    let orgName = "";
    if (typeof window !== "undefined") {
      const storedConfig = localStorage.getItem(`org_config_${slug}`);
      if (storedConfig) {
        try {
          const config = JSON.parse(storedConfig);
          if (config.name) orgName = config.name;
        } catch (e) {}
      }
    }
    if (!orgName) {
      orgName = slug
        .split("-")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    return (
      <div className="coffee-loader-container">
        <style>{`
          .coffee-loader-container {
            --bg: #ffffff;
            --fg: #059669;
            --primary: #10b981;
            --trans-dur: 0.3s;
            background-color: var(--bg);
            color: var(--fg);
            position: fixed;
            inset: 0;
            z-index: 50;
            display: grid;
            place-items: center;
          }
          .coffee {
            font-size: 0.8em;
            position: relative;
            width: 21.5em;
            height: 9em;
          }
          .coffee:before {
            border-bottom: 0.25em dashed;
            content: "";
            display: block;
            position: absolute;
            top: 7.5em;
            width: 100%;
          }
          .coffee__cup,
          .coffee__cup-part,
          .coffee__cup-handle,
          .coffee__steam-part {
            animation-duration: 8s;
            animation-iteration-count: infinite;
          }
          .coffee__cup,
          .coffee__cup-part,
          .coffee__cup-handle {
            animation-timing-function: cubic-bezier(0.9,0,0.1,1);
          }
          .coffee__cup {
            animation-name: cup;
            position: relative;
            width: 11.25em;
            height: 9em;
          }
          .coffee__cup-part {
            background-color: var(--bg);
            position: absolute;
            transition:
              background-color var(--trans-dur),
              box-shadow var(--trans-dur);
          }
          .coffee__cup-part--a {
            animation-name: cup-part-a;
            border-radius: 5.625em 5.625em 5.625em 5.625em / 2em 2em 2.7em 2.7em;
            box-shadow: 0 0 0 0.3em var(--fg) inset;
            top: 4.3em;
            width: 11.25em;
            height: 4.7em;
          }
          .coffee__cup-part--b {
            animation-name: cup-part-b;
            background-color: transparent;
            border-radius: 5.625em / 2em;
            box-shadow: 0 0 0 0.2em var(--fg) inset;
            top: 4.3em;
            width: 11.25em;
            height: 4em;
          }
          .coffee__cup-part--c {
            animation-name: cup-part-c;
            border-radius: 1.7em / 0.45em;
            box-shadow: 0 0 0 0.2em var(--fg) inset;
            top: 7.1em;
            left: 3.925em;
            width: 3.4em;
            height: 0.9em;
          }
          .coffee__cup-part--d,
          .coffee__cup-part--e,
          .coffee__cup-part--f {
            z-index: 1;
          }
          .coffee__cup-part--d {
            animation-name: cup-part-d;
            border-radius: 3.6em 3.6em 3.3em 3.3em / 1em 1em 3.5em 3.5em;
            box-shadow: 0 0 0 0.2em var(--fg) inset;
            top: 2.55em;
            left: 2.025em;
            width: 7.2em;
            height: 5.15em;
          }
          .coffee__cup-part--e {
            animation-name: cup-part-e;
            background-color: var(--fg);
            box-shadow:
              0 0 0 0.2em var(--fg) inset,
              0 1em 0 var(--bg) inset;
            border-radius: 3.5em / 1em;
            top: 2.65em;
            left: 2.125em;
            width: 7em;
            height: 2em;
          }
          .coffee__cup-part--f {
            animation-name: cup-part-f;
            background-color: transparent;
            top: 4.1em;
            left: 5.925em;
            width: 4.8em;
            height: 3em;
          }
          .coffee__cup-handle {
            animation-name: cup-handle;
          }
          .coffee__cup,
          .coffee__steam {
            transform: translateX(-50%);
          }
          .coffee__steam {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 3.5em;
            height: 3.5em;
          }
          .coffee__steam--right {
            right: 0;
            left: auto;
            transform: translateX(50%);
          }
          .coffee__steam-part {
            animation-name: steam-left;
            animation-timing-function: linear;
            stroke-dashoffset: 48;
          }
          .coffee__steam--right .coffee__steam-part {
            animation-name: steam-right;
            stroke-dashoffset: 35;
          }
          .coffee__steam-part--a {
            stroke-dasharray: 24 142;
          }
          .coffee__steam-part--b {
            stroke-dasharray: 30 8 10 130;
          }
          .coffee__steam-part--c {
            stroke-dasharray: 15 6 1 134;
          }
          .coffee__steam-part--d {
            stroke-dasharray: 18 6 1 90;
          }
          .coffee__steam-part--e {
            stroke-dasharray: 25 6 4 76;
          }

          /* Animations */
          @keyframes cup {
            from,
            25%,
            75%,
            to {
              left: 0;
            }
            50% {
              left: 21.5em;
            }
          }
          @keyframes cup-part-a {
            from,
            50%,
            to {
              width: 11.25em;
            }
            25%,
            75% {
              width: calc(11.25em + 21.5em);
            }
          }
          @keyframes cup-part-b {
            from,
            50%,
            to {
              width: 11.25em;
            }
            25%,
            75% {
              width: calc(11.25em + 21.5em);
            }
          }
          @keyframes cup-part-c {
            from,
            50%,
            to {
              width: 3.4em;
            }
            25%,
            75% {
              width: calc(3.4em + 21.5em);
            }
          }
          @keyframes cup-part-d {
            from,
            50%,
            to {
              width: 7.2em;
            }
            25%,
            75% {
              width: calc(7.2em + 21.5em);
            }
          }
          @keyframes cup-part-e {
            from,
            50%,
            to {
              box-shadow:
                0 0 0 0.2em var(--fg) inset,
                0 1em 0 var(--bg) inset;
              width: 7em;
            }
            25%,
            75% {
              box-shadow:
                0 0 0 0.2em var(--fg) inset,
                0 1.5em 0 var(--bg) inset;
              width: calc(7em + 21.5em);
            }
          }
          @keyframes cup-part-f {
            from {
              left: 5.925em;
              z-index: 0;
            }
            25% {
              left: calc(5.925em + 8.35em);
              z-index: 0;
            }
            50% {
              left: 0.525em;
              z-index: 0;
            }
            50.01% {
              left: 0.525em;
              z-index: 1;
            }
            75% {
              left: calc(5.925em + 8.35em);
              z-index: 1;
            }
            to {
              left: 5.925em;
              z-index: 1;
            }
          }
          @keyframes cup-handle {
            from,
            to {
              animation-timing-function: ease-in;
              d: path("M64,4.413s6.64-2.913,11-2.913c11.739,0,19.5,10.759,19.5,22.497,0,23.475-45,22.497-45,22.497");
              transform: translate(0,0);
            }
            10%,
            40%,
            60%,
            90% {
              animation-timing-function: ease-out;
              d: path("M48.036,4.415s-.03-2.913-.049-2.913c-.052,0-.087,10.759-.087,22.497,0,23.475,.2,22.497,.2,22.497");
              transform: translate(0,15px);
            }
            50% {
              animation-timing-function: ease-in;
              d: path("M32,4.413s-6.64-2.913-11-2.913C9.261,1.5,1.5,12.259,1.5,23.997c0,23.475,45,22.497,45,22.497");
              transform: translate(0,0);
            }
          }
          @keyframes steam-left {
            from {
              stroke-dashoffset: 48;
            }
            25%,
            to {
              stroke-dashoffset: -66;
            }
          }
          @keyframes steam-right {
            from,
            50% {
              stroke-dashoffset: 35;
            }
            75%,
            to {
              stroke-dashoffset: -76;
            }
          }
        `}</style>
        <div className="coffee" role="img" aria-label="Coffee cup spinning and stretching from side to side">
          <div className="coffee__cup">
            <div className="coffee__cup-part coffee__cup-part--a"></div>
            <div className="coffee__cup-part coffee__cup-part--b"></div>
            <div className="coffee__cup-part coffee__cup-part--c"></div>
            <div className="coffee__cup-part coffee__cup-part--d"></div>
            <div className="coffee__cup-part coffee__cup-part--e"></div>
            <svg className="coffee__cup-part coffee__cup-part--f" width="96px" height="60px" viewBox="0 0 96 60" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path className="coffee__cup-handle" d="M64,4.413s6.64-2.913,11-2.913c11.739,0,19.5,10.759,19.5,22.497,0,23.475-45,22.497-45,22.497"/>
              </g>
            </svg>
          </div>
          <svg className="coffee__steam" width="56px" height="56px" viewBox="0 0 56 56" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path className="coffee__steam-part coffee__steam-part--a" d="M13.845,54s-5.62-10.115-4.496-16.859,6.83-11.497,8.992-17.983c1.037-3.11,.161-6.937-1.083-10.158"/>
              <path className="coffee__steam-part coffee__steam-part--b" d="M27.844,54s-5.652-10.174-4.522-16.957,6.869-11.564,9.043-18.087c2.261-6.783-4.522-16.957-4.522-16.957"/>
              <path className="coffee__steam-part coffee__steam-part--c" d="M40.434,50.999c-1.577-3.486-3.818-9.462-3.071-13.944,1.121-6.723,6.809-11.462,8.964-17.928,1.033-3.1,.161-6.916-1.08-10.127"/>
            </g>
          </svg>
          <svg className="coffee__steam coffee__steam--right" width="56px" height="56px" viewBox="0 0 56 56" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path className="coffee__steam-part coffee__steam-part--d" d="M19.845,54s-5.62-10.115-4.496-16.859,6.83-11.497,8.992-17.983c1.037-3.11,.161-6.937-1.083-10.158"/>
              <path className="coffee__steam-part coffee__steam-part--e" d="M34.434,44c-1.577-3.486-3.818-9.462-3.071-13.944,1.121-6.723,6.809-11.462,8.964-17.928,1.033-3.1,.161-6.916-1.08-10.127"/>
            </g>
          </svg>
        </div>
      </div>
    );
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
            Login
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
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
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
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <p className="text-center fade-in text-sm text-zinc-600">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-white hover:underline transition-all"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
