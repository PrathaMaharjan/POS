import Hero from "./components/landing/Hero";
import Capabilities from "./components/landing/Capabilities";
import Trial from "./components/landing/Trial";

import Navbar from "./components/Navbar";


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 antialiased overflow-x-hidden">

      <Navbar/>

      <Hero />
      <Capabilities />
      <Trial />

    </div>
  );
}