"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useGSAP(() => {
    gsap.from(".editorial-fade", {
      opacity: 0,
      y: 30,
      duration: 1.4,
      stagger: 0.1,
      ease: "power3.out"
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen bg-black pt-40 px-6 md:px-12 flex flex-col justify-between border-b border-zinc-900"
    >
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <span className="editorial-fade text-xs uppercase tracking-[0.3em] text-zinc-500 font-mono block">
            [BY ABSTRAKT]
          </span>
          <h1 className="editorial-fade text-5xl sm:text-7xl md:text-8xl font-light tracking-tight text-white uppercase leading-[1.50]">
            The Modern  <br />
            <span className="font-serif italic font-normal text-zinc-400">POS</span> <br />
            FOR businesses
          </h1>
        </div>

        <div className="lg:col-span-4 lg:pt-24 space-y-8 border-t border-zinc-900 lg:border-t-0">
          <p className="editorial-fade text-zinc-400 text-lg font-light leading-relaxed tracking-wide">
            Manage sales, inventory, and staff across all your locations with industrial precision and operational velocity.
          </p>
          <div className="editorial-fade flex items-center gap-6 pt-2">
            <button
              onClick={() => router.push("/login")}
              className="relative text-sm uppercase tracking-widest font-medium px-8 py-4 bg-white text-black border border-white overflow-hidden transition-colors duration-300 before:absolute before:inset-0 before:translate-y-full before:bg-black hover:before:translate-y-0 before:transition-transform before:duration-300 hover:text-white z-0 before:-z-10"
            >
              Start free trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}