"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CreditCard, Boxes, Flame } from "lucide-react";


gsap.registerPlugin(ScrollTrigger);

export default function Capabilities() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".editorial-card", {
      opacity: 0,
      duration: 0.8,
      stagger: 0.15, 
      ease: "power2.out",
    });
  }, { scope: sectionRef });

  const capabilities = [
    {
      num: "01",
      title: "Point of Sale",
      desc: "An optimized terminal core for rapid physical transactions under high-intensity merchant demands.",
      icon: CreditCard,
      color: "text-emerald-400"
    },
    {
      num: "02",
      title: "Smart Inventory",
      desc: "Continuous real-time stock orchestration, automated low-count triggers, and predictive pipelines.",
      icon: Boxes,
      color: "text-blue-400"
    },
    {
      num: "03",
      title: "Kitchen Systems",
      desc: "Clean digital ticket processing connecting front-of-house lines straight to terminal kitchens seamlessly.",
      icon: Flame,
      color: "text-amber-500"
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
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index} 
                className="editorial-card p-8 md:p-12 border-r border-b border-zinc-900 flex flex-col justify-between aspect-[1/1] transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out hover:-translate-y-4 hover:bg-zinc-950 hover:border-zinc-800 hover:shadow-[0_0_30px_rgba(255,255,255,0.015)] group"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono text-zinc-655 group-hover:text-zinc-450 transition-colors">
                    [ {item.num} ]
                  </span>
                  <div className={`${item.color} opacity-40 group-hover:opacity-100 transition-opacity duration-300`}>
                    <Icon className="w-6 h-6 stroke-[1.5]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-light text-white uppercase tracking-wide group-hover:text-emerald-400 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 text-sm font-light leading-relaxed tracking-wide">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}