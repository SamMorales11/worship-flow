export function DashboardFooter() {
  return (
    <footer className="h-10 bg-[#0B112B]/90 backdrop-blur-md border-t border-[#26A69A]/30 px-8 flex items-center justify-between font-heading shrink-0">
      <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">
        &copy; {new Date().getFullYear()} WorshipFlow
      </div>
      
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#26A69A]">
          System Operational
        </span>
      </div>
    </footer>
  );
}
