import Link from "next/link";
import { Instagram, Github } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-[#1A237E] text-white py-16 font-heading">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#26A69A]">Worship Flow</h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Elevating the worship experience through intelligent design and seamless flow management.
            </p>
          </div>

          {/* Column 2: Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Features</h3>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link href="/ai-generator" className="hover:text-[#26A69A] transition-colors">AI Generator</Link></li>
              <li><Link href="/songs" className="hover:text-[#26A69A] transition-colors">Song Library</Link></li>
              <li><Link href="/history" className="hover:text-[#26A69A] transition-colors">Analytics</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Resources</h3>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link href="#" className="hover:text-[#26A69A] transition-colors">Documentation</Link></li>
              <li><Link href="#" className="hover:text-[#26A69A] transition-colors">Tutorials</Link></li>
              <li><Link href="#" className="hover:text-[#26A69A] transition-colors">API</Link></li>
            </ul>
          </div>

          {/* Column 4: Social */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Connect</h3>
            <div className="flex gap-4">
              <Link href="#" className="p-2 bg-white/5 rounded-lg hover:text-[#FFD700] transition-all duration-300">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="p-2 bg-white/5 rounded-lg hover:text-[#FFD700] transition-all duration-300">
                <Github className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40 font-medium">
          <p>Made with passion for Worship Teams</p>
          <p>&copy; {new Date().getFullYear()} WorshipFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
