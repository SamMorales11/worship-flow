import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden font-sans flex flex-col items-center justify-center">
      
      {/* Background Ornaments */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        
        {/* Fluid Glows (Depth) - Teal (#26A69A) at 5% opacity */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="absolute w-[800px] h-[800px] bg-secondary opacity-[0.05] rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/4"></div>
          <div className="absolute w-[600px] h-[600px] bg-secondary opacity-[0.05] rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute w-[900px] h-[900px] bg-secondary opacity-[0.04] rounded-full blur-[140px] translate-y-20"></div>
        </div>

        {/* Isometric / Geometric Grid Pattern - Deep Blue (#1A237E) at 3% opacity */}
        <div 
          className="absolute inset-0 z-10 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(30deg, var(--primary) 1px, transparent 1px),
              linear-gradient(150deg, var(--primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--primary) 1px, transparent 1px)
            `,
            backgroundSize: `4rem 6.92rem, 4rem 6.92rem, 4rem 6.92rem`,
            backgroundPosition: `0 0, 0 0, 2rem 3.46rem`
          }}
        />
        {/* Subtle nodes */}
        <div 
          className="absolute inset-0 z-10 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at center, var(--primary) 2px, transparent 0)`,
            backgroundSize: `4rem 6.92rem`,
          }}
        />
      </div>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 max-w-5xl mx-auto text-center w-full">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-md shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-200/50 mb-10 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-secondary"></span>
          <span className="text-sm font-medium text-slate-600 tracking-wide uppercase">Introducing the new era of worship</span>
        </div>
        
        <h1 className="font-heading font-black text-6xl md:text-[5.5rem] lg:text-[7rem] text-primary tracking-tighter leading-[0.95] mb-8 w-full">
          Architect Your <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-secondary/90">
            Worship Flow
          </span>
        </h1>
        
        <p className="font-sans text-xl md:text-2xl text-primary mb-12 max-w-2xl leading-relaxed font-medium mx-auto">
          Intelligent setlisting and seamless management with perfect clarity.
        </p>
        
        <Link 
          href="/dashboard"
          className="group flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-primary text-white font-semibold text-xl shadow-[0_8px_40px_rgb(26,35,126,0.25)] hover:shadow-[0_12px_50px_rgb(26,35,126,0.35)] hover:-translate-y-1 transition-all duration-300 ring-4 ring-primary/10 mx-auto w-fit"
        >
          Get Started
          <Sparkles className="w-6 h-6 text-accent group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
        </Link>
      </main>
    </div>
  );
}
