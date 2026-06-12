"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";


export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  useGSAP(() => {
    gsap.from(".fade-in", {
      opacity: 0,
      y: 20,
      duration: 1.2,
      stagger: 0.08,
      ease: "power3.out",
    });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black text-white flex items-center justify-center px-6"
    >
      
      <div className="w-full max-w-md space-y-10">

  
        <div className="space-y-2">
          
          <h1 className=" text-center fade-in text-5xl font-light tracking-tight text-white uppercase leading-tight">
            Admin Login<br />
            
          </h1>
        </div>

      
        <form className="space-y-6">

        

          <div className="fade-in space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-normal block">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
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
              className="relative w-full text-sm uppercase tracking-widest font-medium px-8 py-4 bg-white text-black border border-white overflow-hidden transition-colors duration-300 before:absolute before:inset-0 before:translate-y-full before:bg-black hover:before:translate-y-0 before:transition-transform before:duration-300 hover:text-white z-0 before:-z-10"
            >
              Login
            </button>
          </div>

        </form>

      

      </div>
    </div>
  );
}