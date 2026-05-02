"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Music, Sparkles, History, Clock, Mic2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Song Library",
    href: "/songs",
    icon: Music,
  },
  {
    name: "AI Setlist Generator",
    href: "/ai-generator",
    icon: Sparkles,
  },
  {
    name: "History & Analytics",
    href: "/history",
    icon: History,
  },
  {
    name: "Run Sheet",
    href: "/runsheet",
    icon: Clock,
  },
  {
    name: "Practice Center",
    href: "/practice",
    icon: Mic2,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  if (pathname?.startsWith("/live")) {
    return null;
  }

  return (
    <aside className="w-64 bg-white border-r border-border h-screen flex flex-col font-heading flex-shrink-0 sticky top-0">
      {/* Back to Home Link */}
      <div className="px-6 pt-6 pb-2">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-200 group text-xs font-semibold uppercase tracking-widest"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>

      {/* Logo Section */}
      <div className="p-6 pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Worship Flow</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-r-lg rounded-l-sm transition-colors duration-200 text-sm font-medium",
                    isActive
                      ? "bg-primary/10 border-l-4 border-primary text-primary"
                      : "border-l-4 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
