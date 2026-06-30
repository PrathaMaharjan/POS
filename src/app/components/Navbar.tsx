
import Link from "next/link";
export default function Navbar() {
  return (
   

      <nav className="fixed top-0 left-0 w-full z-50 border-b bg-transparent border-slate-800/50 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-lg font-bold tracking-tight text-white font-mono hover:opacity-80 transition-opacity">
          ABSTRAKT
        </Link>
        <div className="flex items-center gap-6">

        
          <Link
            href="/login"
            className="relative text-sm font-semibold text-white
                       after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-0 
                       after:bg-white after:transition-all after:duration-300 hover:after:w-full"
          >
            Login
          </Link>

        
         
<Link
  href="/signup"
  className="group relative h-9 rounded-full border border-neutral-200 bg-transparent hover:bg-white px-4 text-white hover:text-slate-900 flex items-center transition-colors duration-300"
>
  <span className="relative inline-flex overflow-hidden">
    <div className="translate-y-0 skew-y-0 transition duration-500 group-hover:-translate-y-[110%] group-hover:skew-y-12 text-sm font-semibold">
      Sign Up
    </div>
    <div className="absolute translate-y-[110%] skew-y-12 transition duration-500 group-hover:translate-y-0 group-hover:skew-y-0 text-sm font-semibold">
      Sign Up
    </div>
  </span>
</Link>

        </div>
      </nav>

    
  );
}