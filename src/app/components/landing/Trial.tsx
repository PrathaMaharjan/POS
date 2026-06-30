"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Check } from "lucide-react";


export default function Trial() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from([".heading-box", ".plan-card"], {
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power2.out",
    });
  }, { scope: sectionRef });


  const plans = [
    {
      name: "Essential Terminal",
      price: "Rs. 2,900",
      period: "per month",
      desc: "Perfect for single-terminal counters, pop-ups, and boutique cafes.",
      features: [
        "1 Cashier Register",
        "Unlimited Transactions",
        "Basic Inventory Controls",
        "Standard Role Suite"
      ],
      isPopular: false
    },
    {
      name: "Professional Suite",
      price: "Rs. 6,900",
      period: "per month",
      desc: "Optimized for high-volume restaurants and busy retail stores.",
      features: [
        "3 Concurrent Terminals",
        "Live Inventory Orchestration",

        "Cashier & Waiter Workflows",
        "Real-Time Analytical Dashboard",
        "Priority 24/7 Support"
      ],
      isPopular: true
    },
    {
      name: "Enterprise Network",
      price: "Rs. 14,900",
      period: "per month",
      desc: "Custom configurations for multi-location groups and franchises.",
      features: [
        "Unlimited Registers",
        "Multi-Outlet Warehouse Flow",
        "Digital Kitchen Tickets (KDS)"
      ],
      isPopular: false
    }
  ];

  return (
    <section ref={sectionRef} className="bg-black py-32 px-6 md:px-12 border-b border-zinc-900">
      <div className="max-w-7xl mx-auto">


        <div className="heading-box flex flex-col items-center text-center mb-20 space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-zinc-555 font-mono block">
            [ FLEXIBLE SUBSCRIPTIONS ]
          </span>
          <h2 className="text-4xl md:text-6xl font-light tracking-tight text-white uppercase leading-none">
            Scalable
            <span className="font-serif italic font-normal text-zinc-400 ml-5">Plans</span>
          </h2>

          <p className="text-zinc-450 text-sm md:text-base font-light leading-relaxed tracking-wide max-w-xl">
            Choose the terminal configuration that matches your scale. Upgrade, downgrade, or suspend anytime.
          </p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-zinc-900">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`plan-card border-r border-b border-zinc-900 p-8 md:p-12 min-h-[550px] flex flex-col justify-between transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out hover:-translate-y-4 hover:bg-zinc-950 group relative ${plan.isPopular ? "bg-zinc-950/40" : "bg-black"
                }`}
            >
              {plan.isPopular && (
                <span className="absolute top-0 right-8 -translate-y-1/2 bg-white text-black font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-black shadow">
                  Most Popular
                </span>
              )}

              <div className="space-y-6">
                <span className="text-xs uppercase tracking-[0.3em] text-zinc-550 font-mono block">
                  [ {plan.name} ]
                </span>

                <div className="text-3xl md:text-4xl font-light tracking-tight text-white uppercase">
                  {plan.price}
                  <span className="text-[10px] font-mono text-zinc-550 lowercase tracking-normal ml-1.5">
                    / {plan.period}
                  </span>
                </div>

                <p className="text-zinc-450 text-xs font-light leading-relaxed min-h-[40px]">
                  {plan.desc}
                </p>


                <div className="w-full h-[1px] bg-zinc-900" />

                <ul className="space-y-3 pt-2">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2.5 text-xs text-zinc-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2.5} />
                      <span className="font-light tracking-wide">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>


              <div className="pt-8">
                <button className={`w-full text-center text-xs uppercase tracking-widest font-bold py-4 rounded-lg transition-all duration-300 ${plan.isPopular
                  ? "bg-white text-black hover:bg-black hover:text-white hover:border-zinc-800 border border-transparent"
                  : "bg-zinc-950 text-white border border-zinc-900 group-hover:bg-white group-hover:text-black group-hover:border-white"
                  }`}>
                  Select License
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}