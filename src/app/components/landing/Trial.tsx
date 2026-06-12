"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";


export default function Trial() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from([".heading-box", ".plan-card"], {
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
  




  const plans = [
    {
      name: "lala",
      price:"500",
      period:"1 month",
      desc:"lalala",
      features:"",
    },
      {
      name: "blabla",
      price:"1000",
      period:"2 month",
      desc:"lalala",
      features:"",
    },

    {
      name: "cccc",
      price:"1500",
      period:"3 month",
      desc:"lalala",
      features:"",
    },
  
  ];
 return (
    <section ref={sectionRef} className="bg-black py-32 px-6 md:px-12 border-b border-zinc-900">
      <div className="max-w-7xl mx-auto">
        

        <div className="heading-box flex flex-col items-center text-center mb-20 space-y-4">
          <h2 className=" text-4xl md:text-6xl font-light tracking-tight text-white uppercase leading-none">
            Scalable 
            <span className="font-serif italic font-normal text-zinc-400 ml-5">Plans</span>
          </h2>

          <p className="text-zinc-400 text-lg font-light leading-relaxed tracking-wide">
            Choose the terminal configuration that fits your scale.
          </p>
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-zinc-900"> 
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className=" border-r border-b border-zinc-900 p-8 md:p-12 min-h-[450px] flex flex-col justify-between bg-black transition-all duration-500 ease-linear hover:-translate-y-5 hover:bg-zinc-950 group"
  >
           
              <div className="space-y-6">
                <span className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-mono block">
                  [ {plan.name} ]
                </span>
                
                <div className="text-4xl md:text-5xl font-light tracking-tight text-white uppercase">
                  {plan.price}
                  <span className="text-xs font-mono text-zinc-600 lowercase tracking-normal ml-1">
                    {plan.period}
                  </span>
                </div>

                <p className="text-zinc-400 text-sm font-light leading-relaxed">
                  {plan.desc}
                </p>

                
                <div className="w-full h-[1px] bg-zinc-900" />

            
                <p className="text-zinc-500 font-mono text-xs leading-relaxed">
                  {plan.features}
                </p>
              </div>

             
              <div className="pt-8">
                <button className="w-full text-center text-xs uppercase tracking-widest font-medium py-4 bg-zinc-950 text-white border border-zinc-800 transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:border-white">
                  Start
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
  }