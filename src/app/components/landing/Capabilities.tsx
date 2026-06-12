"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";


gsap.registerPlugin(ScrollTrigger);

export default function Capabilities() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {

    gsap.from(".editorial-card", {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        toggleActions: "play none none reverse", 
      },
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.15, 
      ease: "power2.out",
    });
  }, { scope: sectionRef });

  const capabilities = [
    {
      num: "01",
      title: "Point of Sale",
      desc: "An optimized terminal core for rapid physical transactions under high-intensity merchant demands."
    },
    {
      num: "02",
      title: "Smart Inventory",
      desc: "Continuous real-time stock orchestration, automated low-count triggers, and predictive pipelines."
    },
    {
      num: "03",
      title: "Kitchen Systems",
      desc: "Clean digital ticket processing connecting front-of-house lines straight to terminal kitchens seamlessly."
    }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="bg-black py-32 px-6 md:px-12 border-b border-zinc-900"
    >
      <div className="max-w-7xl mx-auto">
        
       
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-20">
          <div className="lg:col-span-8">
            
            <h2 className="text-4xl md:text-6xl font-light tracking-tight text-white uppercase leading-none">
              Engineered for <br />
              <span className="font-serif italic font-normal text-zinc-400">Throughput.</span>
            </h2>
          </div>
          <div className="lg:col-span-4 border-l border-zinc-900 pl-6 hidden lg:block">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest leading-relaxed">
              Built for high-stakes business environments where every millisecond and every unit counts. <br />
        
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-zinc-900">
          {capabilities.map((item, index) => (
            <div 
              key={index} 
              className="reditoial-card p-8 md:p-12 border-r border-b border-zinc-900 flex flex-col justify-between aspect-[1/1] transition-colors duration-300 hover:bg-zinc-950 group"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">
                  [ {item.num} ]
                </span>
                <span className="text-2xl font-light text-zinc-800 font-mono group-hover:text-white transition-colors duration-500">
                  ↓
                </span>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-light text-white uppercase tracking-wide">
                  {item.title}
                </h3>
                <p className="text-zinc-400 text-sm font-light leading-relaxed tracking-wide">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}